'use strict';

exports.isStar = true;
exports.runParallel = runParallel;

function withTimeout(job, timeout) {
    return Promise.race([
        new Promise(resolve => setTimeout(resolve, timeout,
            new Error(`Timed out waiting for ${timeout} MILLISECONDS`))),
        job().catch(error => error)
    ]);
}

/** Функция паралелльно запускает указанное число промисов
 * @param {Array} jobs – функции, которые возвращают промисы
 * @param {Number} parallelNum - число одновременно исполняющихся промисов
 * @param {Number} timeout - таймаут работы промиса
 * @returns {Promise<Array>}
 */
function runParallel(jobs, parallelNum, timeout = 1000) {
    let results = [];
    let lastBatchId = 0;

    function executeBatch(batchJobs) {
        if (batchJobs.length === 0) {
            return Promise.resolve();
        }

        const batchId = lastBatchId++;
        const currentJob = withTimeout(batchJobs.shift(), timeout);

        return currentJob.then((result) => {
            results[batchId] = result;

            return executeBatch(batchJobs);
        });
    }

    let batches = [];
    while (parallelNum-- > 0 && jobs.length > 0) {
        batches.push(executeBatch(jobs));
    }

    return Promise.all(batches).then(() => results);
}
