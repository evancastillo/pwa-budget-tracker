let db;

function idbConnect() {
  const request = indexedDB.open('budget_tracker', 1);

  request.onupgradeneeded = function (event) {

    const db = event.target.result;

    db.createObjectStore('budget', { autoIncrement: true });
  };

  request.onerror = function (event) {
    console.log(event.target.errorCode);
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
      idbSyncTransactions();
    }
  };

  return request;
}

function idbSaveRecord(record) {
  console.log('saving record in indexedDB', record);

  const transaction = db.transaction(['budget'], 'readwrite');

  const budgetObjectStore = transaction.objectStore('budget');

  budgetObjectStore.add(record);
}

function idbSyncTransactions() {
  const transaction = db.transaction(['budget'], 'readwrite');

  const budgetObjectStore = transaction.objectStore('budget');

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(['budget'], 'readwrite');

          const budgetObjectStore = transaction.objectStore('budget');

          budgetObjectStore.clear();

          alert('All saved transactions have been submitted!');
          location.reload();
        })
        .catch(err => {
          console.log(err);
        });

    } else {
      const event = document.createEvent('Event');
      event.initEvent('readytosync', true, true);
      window.dispatchEvent(event);
    }
  };
}

idbConnect();

window.addEventListener('online', idbSyncTransactions);