const firebaseConfig = {
  databaseURL: "https://coffee-dda5d-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('admin-year').textContent = new Date().getFullYear();
  checkAuth();
  loadMenuList();
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

function loadMenuList() {
  db.ref("menu").on("value", snapshot => {
    const menuListContainer = document.getElementById('menu-list');
    menuListContainer.innerHTML = '';
    const items = snapshot.val();
    
    if (!items) {
      menuListContainer.innerHTML = `
        <div class="empty-menu">
          <i class="fas fa-utensils"></i>
          <p>لا توجد أصناف في القائمة</p>
        </div>
      `;
      return;
    }
    
    for (const [key, item] of Object.entries(items)) {
      const itemElement = createMenuItemElement(key, item);
      menuListContainer.appendChild(itemElement);
    }
  });
}

// باقي الدوال الخاصة بإدارة القائمة
// ... (addMenuItem, deleteMenuItem, etc.)
