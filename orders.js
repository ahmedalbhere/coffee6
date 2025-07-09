const firebaseConfig = {
  databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-year').textContent = new Date().getFullYear();
  checkAuth();
  loadOrders();
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

function loadOrders(filter = 'all') {
  db.ref("orders").orderByChild("timestamp").on("value", snapshot => {
    const ordersContainer = document.getElementById('orders');
    ordersContainer.innerHTML = '';
    const orders = snapshot.val();
    
    let pendingCount = 0;
    let completedCount = 0;
    let totalAmount = 0;
    
    if (!orders) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <i class="fas fa-clipboard"></i>
          <p>لا توجد طلبات حالياً</p>
        </div>
      `;
      updateStats(pendingCount, completedCount, totalAmount);
      return;
    }
    
    const ordersArray = Object.entries(orders).reverse();
    let hasOrders = false;
    
    ordersArray.forEach(([key, order]) => {
      if (filter === 'all' || 
          (filter === 'pending' && order.status !== 'completed') || 
          (filter === 'completed' && order.status === 'completed')) {
        
        hasOrders = true;
        const orderElement = createOrderElement(key, order);
        ordersContainer.appendChild(orderElement);
        
        if (order.status === 'completed') {
          completedCount++;
          totalAmount += calculateOrderTotal(order);
        } else {
          pendingCount++;
        }
      }
    });
    
    if (!hasOrders) {
      ordersContainer.innerHTML = `
        <div class="empty-orders">
          <i class="fas fa-clipboard"></i>
          <p>لا توجد طلبات ${filter === 'pending' ? 'قيد الانتظار' : 'مكتملة'}</p>
        </div>
      `;
    }
    
    updateStats(pendingCount, completedCount, totalAmount);
  });
}

// باقي الدوال الموجودة في admin.js الخاصة بالطلبات
// ... (completeOrder, deleteOrder, clearCompleted, filterOrders, etc.)
