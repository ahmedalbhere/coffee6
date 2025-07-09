const firebaseConfig = {
  databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
let salesChart = null;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-year').textContent = new Date().getFullYear();
  checkAuth();
  loadDailyReport();
});

function checkAuth() {
  if (localStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'admin.html';
  }
}

function logout() {
  if (confirm("هل تريد تسجيل الخروج من لوحة التحكم؟")) {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin.html';
  }
}

function loadDailyReport() {
  updateActiveTab('daily');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  db.ref("orders").orderByChild("completedAt").startAt(today.getTime()).on("value", snapshot => {
    processReportData(snapshot.val(), 'اليوم');
  });
}

function loadWeeklyReport() {
  updateActiveTab('weekly');
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  oneWeekAgo.setHours(0, 0, 0, 0);
  
  db.ref("orders").orderByChild("completedAt").startAt(oneWeekAgo.getTime()).on("value", snapshot => {
    processReportData(snapshot.val(), 'الأسبوع');
  });
}

function loadMonthlyReport() {
  updateActiveTab('monthly');
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  oneMonthAgo.setHours(0, 0, 0, 0);
  
  db.ref("orders").orderByChild("completedAt").startAt(oneMonthAgo.getTime()).on("value", snapshot => {
    processReportData(snapshot.val(), 'الشهر');
  });
}

function processReportData(orders, period) {
  if (!orders) {
    updateSummary(0, 0, 0);
    renderChart([], [], period);
    document.getElementById('top-items-list').innerHTML = '<p>لا توجد بيانات</p>';
    return;
  }

  let totalSales = 0;
  let ordersCount = 0;
  let itemsCount = 0;
  const itemsMap = new Map();
  const dailySales = new Map();
  
  Object.values(orders).forEach(order => {
    if (order.status === 'completed') {
      ordersCount++;
      const orderDate = new Date(order.completedAt).toLocaleDateString('ar-EG');
      let dayTotal = dailySales.get(orderDate) || 0;
      
      order.items.forEach(item => {
        const itemTotal = item.price * item.qty;
        totalSales += itemTotal;
        itemsCount += item.qty;
        dayTotal += itemTotal;
        
        // حساب الأصناف الأكثر طلباً
        const currentCount = itemsMap.get(item.name) || 0;
        itemsMap.set(item.name, currentCount + item.qty);
      });
      
      dailySales.set(orderDate, dayTotal);
    }
  });

  updateSummary(totalSales, ordersCount, itemsCount);
  renderChart(Array.from(dailySales.keys()), Array.from(dailySales.values()), period);
  renderTopItems(itemsMap);
}

function updateSummary(total, orders, items) {
  document.getElementById('total-sales').textContent = total.toFixed(2) + ' ج';
  document.getElementById('orders-count').textContent = orders;
  document.getElementById('items-count').textContent = items;
}

function renderChart(labels, data, period) {
  const ctx = document.getElementById('salesChart').getContext('2d');
  
  if (salesChart) {
    salesChart.destroy();
  }
  
  salesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: `المبيعات (${period})`,
        data: data,
        backgroundColor: '#6F4E37',
        borderColor: '#4B3621',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'المبلغ (جنيه)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'التاريخ'
          }
        }
      }
    }
  });
}

function renderTopItems(itemsMap) {
  const topItemsList = document.getElementById('top-items-list');
  topItemsList.innerHTML = '';
  
  if (itemsMap.size === 0) {
    topItemsList.innerHTML = '<p>لا توجد بيانات</p>';
    return;
  }
  
  // تحويل الخريطة إلى مصفوفة وترتيبها تنازلياً
  const sortedItems = Array.from(itemsMap.entries()).sort((a, b) => b[1] - a[1]);
  
  // عرض أفضل 5 أصناف
  sortedItems.slice(0, 5).forEach(([name, count], index) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'top-item';
    itemElement.innerHTML = `
      <span class="item-rank">${index + 1}</span>
      <span class="item-name">${name}</span>
      <span class="item-count">${count} طلب</span>
    `;
    topItemsList.appendChild(itemElement);
  });
}

function updateActiveTab(activeTab) {
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  event.target.classList.add('active');
}
