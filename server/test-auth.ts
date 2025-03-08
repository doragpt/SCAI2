import { hashPassword, comparePasswords } from './routes';
import { generateToken, verifyToken } from './jwt';

async function testPasswordHashing() {
  try {
    console.log('=== パスワードハッシュ化テスト開始 ===');
    const testPassword = 'password123';
    
    // パスワードハッシュ化のテスト
    console.log('1. パスワードハッシュ化テスト');
    const hashedPassword = await hashPassword(testPassword);
    console.log('生成されたハッシュ:', {
      fullHash: hashedPassword,
      hashParts: hashedPassword.split('.'),
      hashLength: hashedPassword.length,
      timestamp: new Date().toISOString()
    });

    // パスワード比較テスト
    console.log('\n2. パスワード比較テスト');
    const isValid = await comparePasswords(testPassword, hashedPassword);
    console.log('パスワード検証結果:', {
      isValid,
      originalPassword: testPassword,
      timestamp: new Date().toISOString()
    });

    // 不正なパスワードテスト
    console.log('\n3. 不正なパスワードテスト');
    const isInvalidValid = await comparePasswords('wrongpassword', hashedPassword);
    console.log('不正なパスワード検証結果:', {
      isValid: isInvalidValid,
      timestamp: new Date().toISOString()
    });

    return hashedPassword;
  } catch (error) {
    console.error('パスワードテストエラー:', error);
    throw error;
  }
}

async function testJWTFlow() {
  try {
    console.log('\n=== JWTフローテスト開始 ===');
    const testUser = {
      id: 14,
      username: 'store_test',
      role: 'store',
      displayName: 'テスト店舗',
      location: '東京都',
      password: 'dummy'
    };

    // トークン生成テスト
    console.log('1. JWTトークン生成テスト');
    const token = generateToken(testUser);
    console.log('生成されたトークン:', {
      token: token.substring(0, 20) + '...',
      length: token.length,
      timestamp: new Date().toISOString()
    });

    // トークン検証テスト
    console.log('\n2. JWTトークン検証テスト');
    const decoded = verifyToken(token);
    console.log('デコードされたペイロード:', {
      userId: decoded.userId,
      role: decoded.role,
      timestamp: new Date().toISOString()
    });

    return token;
  } catch (error) {
    console.error('JWTテストエラー:', error);
    throw error;
  }
}

// テストの実行
async function runTests() {
  try {
    const hashedPassword = await testPasswordHashing();
    const token = await testJWTFlow();

    console.log('\n=== テスト結果サマリー ===');
    console.log('生成されたパスワードハッシュ:', hashedPassword);
    console.log('生成されたJWTトークン:', token.substring(0, 20) + '...');
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

runTests();
