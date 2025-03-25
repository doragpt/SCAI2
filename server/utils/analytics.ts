import { db } from '../db';
import { eq, and, desc, gte, lte, sql, or } from 'drizzle-orm';
import { applications, store_profiles, talentProfiles, users, keepList, viewHistory } from '../../shared/schema';
import { log } from './logger';

/**
 * マッチング分析のためのデータを収集する
 * 
 * @param userId ユーザーID
 * @returns ユーザーのインタラクションデータ
 */
export async function collectUserInteractions(userId: number) {
  try {
    // ユーザーの応募履歴を取得
    const userApplications = await db
      .select({
        id: applications.id,
        store_profile_id: applications.store_profile_id,
        status: applications.status,
        created_at: applications.created_at
      })
      .from(applications)
      .where(eq(applications.user_id, userId))
      .orderBy(desc(applications.created_at));

    // ユーザーの閲覧履歴を取得
    const userViewHistory = await db
      .select({
        id: viewHistory.id,
        store_profile_id: viewHistory.store_profile_id,
        viewed_at: viewHistory.viewed_at
      })
      .from(viewHistory)
      .where(eq(viewHistory.user_id, userId))
      .orderBy(desc(viewHistory.viewed_at))
      .limit(50); // 最新50件に制限

    // ユーザーのキープリストを取得
    const userKeepList = await db
      .select({
        id: keepList.id,
        store_profile_id: keepList.store_profile_id,
        added_at: keepList.added_at
      })
      .from(keepList)
      .where(eq(keepList.user_id, userId));

    return {
      applications: userApplications,
      viewHistory: userViewHistory,
      keepList: userKeepList
    };
  } catch (error) {
    log('error', 'ユーザーのインタラクションデータ取得に失敗', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * ユーザーのマッチング行動から優先度の重み付け調整を計算する
 * 
 * @param userId ユーザーID
 * @returns 重み付け調整オブジェクト
 */
export async function calculateUserWeightAdjustments(userId: number) {
  try {
    const interactionData = await collectUserInteractions(userId);
    
    // 重み付け調整の初期値
    const weightAdjustments: Record<string, number> = {
      AGE: 0,
      LOCATION: 0,
      BODY_TYPE: 0,
      CUP_SIZE: 0, 
      GUARANTEE: 0,
      SERVICE: 0,
      TATTOO: 0,
      HAIR_COLOR: 0,
      APPEARANCE: 0
    };
    
    // 申し込み済みの店舗情報を取得
    const appliedStoreIds = interactionData.applications.map(app => app.store_profile_id);
    if (appliedStoreIds.length > 0) {
      const appliedStores = await db
        .select()
        .from(store_profiles)
        .where(
          sql`${store_profiles.id} IN (${appliedStoreIds.join(',')})`
        );
      
      // 申し込んだ店舗の特性を分析
      for (const store of appliedStores) {
        // 地域の傾向
        weightAdjustments.LOCATION += 0.5;
        
        // 給与の傾向
        if (store.minimum_guarantee > 25000) {
          weightAdjustments.GUARANTEE += 0.5;
        }
        
        // 業種の傾向
        weightAdjustments.SERVICE += 0.5;
        
        // 外見・髪色の条件が細かい店舗を好む傾向
        if (store.requirements?.preferred_look_types?.length > 0) {
          weightAdjustments.APPEARANCE += 0.3;
        }
        
        if (store.requirements?.preferred_hair_colors?.length > 0) {
          weightAdjustments.HAIR_COLOR += 0.3;
        }
        
        // タトゥー条件が厳しいかどうか
        if (store.requirements?.tattoo_acceptance === 'なし') {
          weightAdjustments.TATTOO += 0.3;
        }
      }
    }
    
    // キープした店舗の分析
    if (interactionData.keepList.length > 0) {
      const keptStoreIds = interactionData.keepList.map(item => item.store_profile_id);
      const keptStores = await db
        .select()
        .from(store_profiles)
        .where(
          sql`${store_profiles.id} IN (${keptStoreIds.join(',')})`
        );
      
      // キープした店舗の分析（応募よりも弱い重みで）
      for (const store of keptStores) {
        // 地域の傾向
        weightAdjustments.LOCATION += 0.3;
        
        // 給与の傾向
        if (store.minimum_guarantee > 25000) {
          weightAdjustments.GUARANTEE += 0.3;
        }
        
        // その他の条件も少しずつ強化
        weightAdjustments.SERVICE += 0.2;
        
        if (store.requirements?.preferred_body_types?.length > 0) {
          weightAdjustments.BODY_TYPE += 0.2;
        }
      }
    }
    
    // 閲覧履歴の分析（最も弱い重み）
    if (interactionData.viewHistory.length > 0) {
      const viewedStoreIds = interactionData.viewHistory.map(item => item.store_profile_id);
      const viewedStores = await db
        .select()
        .from(store_profiles)
        .where(
          sql`${store_profiles.id} IN (${viewedStoreIds.join(',')})`
        );
      
      for (const store of viewedStores) {
        // 閲覧だけなので軽い重み
        weightAdjustments.LOCATION += 0.1;
        weightAdjustments.GUARANTEE += 0.1;
        weightAdjustments.SERVICE += 0.1;
      }
    }
    
    // 重み付け調整に上限を設定
    for (const key in weightAdjustments) {
      // 最大調整量を5.0に制限
      weightAdjustments[key] = Math.min(5.0, weightAdjustments[key]);
    }
    
    return weightAdjustments;
  } catch (error) {
    log('error', 'ユーザーの重み付け調整計算に失敗', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // エラー時は空の調整値を返す
    return {};
  }
}

/**
 * マッチング統計データを取得する
 * @returns システム全体のマッチング統計
 */
export async function getMatchingStatistics() {
  try {
    // 申し込み総数
    const totalApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications);
    const totalApplications = Number(totalApplicationsResult[0]?.count || 0);
    
    // 承認された申し込み数
    const acceptedApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .where(eq(applications.status, 'accepted'));
    const acceptedApplications = Number(acceptedApplicationsResult[0]?.count || 0);
    
    // 拒否された申し込み数
    const rejectedApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .where(eq(applications.status, 'rejected'));
    const rejectedApplications = Number(rejectedApplicationsResult[0]?.count || 0);
    
    // 保留中の申し込み数
    const pendingApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .where(eq(applications.status, 'pending'));
    const pendingApplications = Number(pendingApplicationsResult[0]?.count || 0);
    
    // 最近1週間の申し込み数
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .where(gte(applications.created_at, oneWeekAgo));
    const recentApplications = Number(recentApplicationsResult[0]?.count || 0);
    
    // 最も人気のある地域（申し込みベース）
    const popularLocationsResult = await db
      .select({
        location: store_profiles.location,
        count: sql`count(*)`
      })
      .from(applications)
      .innerJoin(store_profiles, eq(applications.store_profile_id, store_profiles.id))
      .groupBy(store_profiles.location)
      .orderBy(desc(sql`count(*)`))
      .limit(5);
    
    // 最も人気のあるサービスタイプ
    const popularServicesResult = await db
      .select({
        serviceType: store_profiles.service_type,
        count: sql`count(*)`
      })
      .from(applications)
      .innerJoin(store_profiles, eq(applications.store_profile_id, store_profiles.id))
      .groupBy(store_profiles.service_type)
      .orderBy(desc(sql`count(*)`))
      .limit(5);
    
    return {
      applications: {
        total: totalApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
        pending: pendingApplications,
        recentWeek: recentApplications,
        acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0
      },
      popularLocations: popularLocationsResult.map(item => ({
        location: item.location,
        count: Number(item.count)
      })),
      popularServices: popularServicesResult.map(item => ({
        serviceType: item.serviceType,
        count: Number(item.count)
      }))
    };
  } catch (error) {
    log('error', 'マッチング統計の取得に失敗', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * 店舗のパフォーマンス分析データを取得する
 * 
 * @param storeId 店舗ID
 * @returns 店舗のパフォーマンス分析
 */
export async function getStorePerformanceAnalytics(storeId: number) {
  try {
    // 店舗情報を取得
    const [storeProfile] = await db
      .select()
      .from(store_profiles)
      .where(eq(store_profiles.id, storeId))
      .limit(1);
    
    if (!storeProfile) {
      throw new Error('店舗が見つかりません');
    }
    
    // 店舗への申し込み総数
    const totalApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .where(eq(applications.store_profile_id, storeId));
    const totalApplications = Number(totalApplicationsResult[0]?.count || 0);
    
    // 承認した申し込み数
    const acceptedApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .where(
        and(
          eq(applications.store_profile_id, storeId),
          eq(applications.status, 'accepted')
        )
      );
    const acceptedApplications = Number(acceptedApplicationsResult[0]?.count || 0);
    
    // 拒否した申し込み数
    const rejectedApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .where(
        and(
          eq(applications.store_profile_id, storeId),
          eq(applications.status, 'rejected')
        )
      );
    const rejectedApplications = Number(rejectedApplicationsResult[0]?.count || 0);
    
    // 保留中の申し込み数
    const pendingApplicationsResult = await db
      .select({ count: sql`count(*)` })
      .from(applications)
      .where(
        and(
          eq(applications.store_profile_id, storeId),
          eq(applications.status, 'pending')
        )
      );
    const pendingApplications = Number(pendingApplicationsResult[0]?.count || 0);
    
    // 閲覧数
    const viewsResult = await db
      .select({ count: sql`count(*)` })
      .from(viewHistory)
      .where(eq(viewHistory.store_profile_id, storeId));
    const totalViews = Number(viewsResult[0]?.count || 0);
    
    // キープリスト登録数
    const keepsResult = await db
      .select({ count: sql`count(*)` })
      .from(keepList)
      .where(eq(keepList.store_profile_id, storeId));
    const totalKeeps = Number(keepsResult[0]?.count || 0);
    
    // 月間の閲覧数推移（直近3ヶ月）
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const monthlyViewsResult = await db
      .select({
        month: sql`DATE_TRUNC('month', ${viewHistory.viewed_at})`,
        count: sql`count(*)`
      })
      .from(viewHistory)
      .where(
        and(
          eq(viewHistory.store_profile_id, storeId),
          gte(viewHistory.viewed_at, threeMonthsAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${viewHistory.created_at})`)
      .orderBy(sql`DATE_TRUNC('month', ${viewHistory.created_at})`);
    
    // 申し込みの月間推移（直近3ヶ月）
    const monthlyApplicationsResult = await db
      .select({
        month: sql`DATE_TRUNC('month', ${applications.created_at})`,
        count: sql`count(*)`
      })
      .from(applications)
      .where(
        and(
          eq(applications.store_profile_id, storeId),
          gte(applications.created_at, threeMonthsAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${applications.created_at})`)
      .orderBy(sql`DATE_TRUNC('month', ${applications.created_at})`);
    
    // コンバージョン率
    const conversionRate = totalViews > 0 ? (totalApplications / totalViews) * 100 : 0;
    // キープ率
    const keepRate = totalViews > 0 ? (totalKeeps / totalViews) * 100 : 0;
    
    return {
      storeProfile: {
        id: storeProfile.id,
        businessName: storeProfile.business_name,
        location: storeProfile.location,
        serviceType: storeProfile.service_type
      },
      applications: {
        total: totalApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
        pending: pendingApplications,
        acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications) * 100 : 0
      },
      engagement: {
        totalViews,
        totalKeeps,
        conversionRate,
        keepRate
      },
      trends: {
        monthlyViews: monthlyViewsResult.map(item => ({
          month: item.month,
          count: Number(item.count)
        })),
        monthlyApplications: monthlyApplicationsResult.map(item => ({
          month: item.month,
          count: Number(item.count)
        }))
      }
    };
  } catch (error) {
    log('error', '店舗パフォーマンス分析の取得に失敗', {
      storeId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * 求職者のアクティビティ分析データを取得する
 * 
 * @param userId ユーザーID
 * @returns ユーザーのアクティビティ分析
 */
export async function getTalentActivityAnalytics(userId: number) {
  try {
    // ユーザー情報を取得
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }
    
    // タレントプロフィールを取得
    const [talentProfile] = await db
      .select()
      .from(talentProfiles)
      .where(eq(talentProfiles.user_id, userId))
      .limit(1);
    
    // 申し込み履歴を取得
    const applicationsResult = await db
      .select({
        id: applications.id,
        storeProfileId: applications.store_profile_id,
        status: applications.status,
        createdAt: applications.created_at,
        businessName: store_profiles.business_name,
        location: store_profiles.location,
        serviceType: store_profiles.service_type
      })
      .from(applications)
      .innerJoin(store_profiles, eq(applications.store_profile_id, store_profiles.id))
      .where(eq(applications.user_id, userId))
      .orderBy(desc(applications.created_at));
    
    // 閲覧履歴を取得
    const viewsResult = await db
      .select({
        id: viewHistory.id,
        storeId: viewHistory.store_profile_id,
        viewedAt: viewHistory.viewed_at,
        businessName: store_profiles.business_name,
        location: store_profiles.location,
        serviceType: store_profiles.service_type
      })
      .from(viewHistory)
      .innerJoin(store_profiles, eq(viewHistory.store_profile_id, store_profiles.id))
      .where(eq(viewHistory.user_id, userId))
      .orderBy(desc(viewHistory.created_at))
      .limit(20);
    
    // キープリストを取得
    const keepsResult = await db
      .select({
        id: keepList.id,
        storeId: keepList.store_profile_id,
        addedAt: keepList.added_at,
        businessName: store_profiles.business_name,
        location: store_profiles.location,
        serviceType: store_profiles.service_type
      })
      .from(keepList)
      .innerJoin(store_profiles, eq(keepList.store_profile_id, store_profiles.id))
      .where(eq(keepList.user_id, userId))
      .orderBy(desc(keepList.created_at));
    
    // 申し込み結果の集計
    const applicationStatuses = {
      total: applicationsResult.length,
      accepted: applicationsResult.filter(app => app.status === 'accepted').length,
      rejected: applicationsResult.filter(app => app.status === 'rejected').length,
      pending: applicationsResult.filter(app => app.status === 'pending').length
    };
    
    // 申し込み率
    const conversionRate = viewsResult.length > 0 
      ? (applicationsResult.length / viewsResult.length) * 100 
      : 0;
    
    // 月間の活動推移（直近3ヶ月）
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    // 月ごとの閲覧数
    const monthlyViewsResult = await db
      .select({
        month: sql`DATE_TRUNC('month', ${viewHistory.created_at})`,
        count: sql`count(*)`
      })
      .from(viewHistory)
      .where(
        and(
          eq(viewHistory.user_id, userId),
          gte(viewHistory.created_at, threeMonthsAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${viewHistory.created_at})`)
      .orderBy(sql`DATE_TRUNC('month', ${viewHistory.created_at})`);
    
    // 月ごとの申し込み数
    const monthlyApplicationsResult = await db
      .select({
        month: sql`DATE_TRUNC('month', ${applications.created_at})`,
        count: sql`count(*)`
      })
      .from(applications)
      .where(
        and(
          eq(applications.user_id, userId),
          gte(applications.created_at, threeMonthsAgo)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${applications.created_at})`)
      .orderBy(sql`DATE_TRUNC('month', ${applications.created_at})`);
    
    // 業種ごとの閲覧・申し込み分布
    const serviceTypeDistributionResult = await db
      .select({
        serviceType: store_profiles.service_type,
        viewCount: sql`COUNT(DISTINCT CASE WHEN ${viewHistory.id} IS NOT NULL THEN ${viewHistory.id} ELSE NULL END)`,
        applicationCount: sql`COUNT(DISTINCT CASE WHEN ${applications.id} IS NOT NULL THEN ${applications.id} ELSE NULL END)`
      })
      .from(store_profiles)
      .leftJoin(
        viewHistory, 
        and(
          eq(store_profiles.id, viewHistory.store_id),
          eq(viewHistory.user_id, userId)
        )
      )
      .leftJoin(
        applications,
        and(
          eq(store_profiles.id, applications.store_profile_id),
          eq(applications.user_id, userId)
        )
      )
      .groupBy(store_profiles.service_type)
      .having(
        or(
          sql`COUNT(DISTINCT CASE WHEN ${viewHistory.id} IS NOT NULL THEN ${viewHistory.id} ELSE NULL END) > 0`,
          sql`COUNT(DISTINCT CASE WHEN ${applications.id} IS NOT NULL THEN ${applications.id} ELSE NULL END) > 0`
        )
      );
    
    return {
      user: {
        id: user.id,
        username: user.username,
        location: user.location,
        role: user.role
      },
      talentProfile: talentProfile ? {
        height: talentProfile.height,
        weight: talentProfile.weight,
        cupSize: talentProfile.cup_size,
        // その他の必要なプロフィール情報
      } : null,
      applications: {
        list: applicationsResult,
        stats: applicationStatuses
      },
      viewHistory: viewsResult,
      keepList: keepsResult,
      engagement: {
        totalViews: viewsResult.length,
        totalApplications: applicationsResult.length,
        totalKeeps: keepsResult.length,
        conversionRate
      },
      trends: {
        monthlyViews: monthlyViewsResult.map(item => ({
          month: item.month,
          count: Number(item.count)
        })),
        monthlyApplications: monthlyApplicationsResult.map(item => ({
          month: item.month,
          count: Number(item.count)
        }))
      },
      preferences: {
        serviceTypeDistribution: serviceTypeDistributionResult.map(item => ({
          serviceType: item.serviceType,
          viewCount: Number(item.viewCount),
          applicationCount: Number(item.applicationCount)
        }))
      }
    };
  } catch (error) {
    log('error', '求職者アクティビティ分析の取得に失敗', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}