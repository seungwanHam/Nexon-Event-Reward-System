class TestCaseReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    console.log('\n테스트 결과 요약:');
    
    // 테스트 스위트별로 정보 출력
    results.testResults.forEach(testSuite => {
      console.log(`\n파일: ${testSuite.testFilePath.split('/').pop()}`);
      
      // 각 테스트 스위트 내의 결과를 검사
      testSuite.testResults.forEach(test => {
        const title = test.title;
        // 테스트 케이스 이름만 간결하게 출력
        const prefix = test.status === 'passed' ? '✓ ' : '✗ ';
        console.log(`  ${prefix}${title}`);
      });
    });

    // 전체 요약
    console.log('\n===== 테스트 종합 결과 =====');
    console.log(`총 테스트 스위트: ${results.numTotalTestSuites}, 통과: ${results.numPassedTestSuites}, 실패: ${results.numFailedTestSuites}`);
    console.log(`총 테스트 케이스: ${results.numTotalTests}, 통과: ${results.numPassedTests}, 실패: ${results.numFailedTests}`);
    console.log(`실행 시간: ${(results.startTime ? (Date.now() - results.startTime) / 1000 : 0).toFixed(1)}초`);
  }
}

module.exports = TestCaseReporter; 