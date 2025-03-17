import { hashPassword, comparePasswords } from './auth';

async function testPasswordHashing() {
  try {
    console.log('=== パスワードハッシュ化テスト開始 ===');
    const testPassword = 'test1234';

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

    return hashedPassword;
  } catch (error) {
    console.error('パスワードテストエラー:', error);
    throw error;
  }
}

// テストの実行
async function runTests() {
  try {
    const hashedPassword = await testPasswordHashing();
    console.log('\n=== テスト結果サマリー ===');
    console.log('生成されたパスワードハッシュ:', hashedPassword);
  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

runTests();