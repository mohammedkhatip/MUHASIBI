

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} 


from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  startAt,
  endAt,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  increment,
  arrayUnion,
  getDoc,
  arrayRemove,
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDvOLsG6Sk5PFuyGSh5aFFsHNLc9vqa8EE",
  authDomain: "test-96524.firebaseapp.com",
  projectId: "test-96524",
  storageBucket: "test-96524.firebasestorage.app",
  messagingSenderId: "571466546618",
  appId: "1:571466546618:web:c9e2648747c9acc721f183",
  measurementId: "G-HQBBZPM7LD",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let selectedCustomer = null;

// مصادقة المستخدم
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    showDashboard();
    loadCustomers();
  } else {
    showAuthSection();
    
  }
});

window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert('تم تسجيل الدخول بنجاح')

  } catch (error) {
    alert("خطأ في تسجيل الدخول: " + error.message);
  }
};

// تسجيل الخروج
window.logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    alert('خطأ في تسجيل الخروج: ' + error.message);
  }
};



// إدارة الواجهة
function showDashboard() {
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('dashboard').style.display = 'grid';
}









function showAuthSection() {
  document.getElementById('authSection').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
}


// إضافة زبون
window.addCustomer = async () => {
  const name = document.getElementById('newCustomerName').value.trim();
  if (!name) {
      alert('يرجى إدخال اسم الزبون');
      return;
  }

  try {
      await addDoc(collection(db, "stores", currentUser.uid, "customers"), {
          name: name,
          balance: 0,
          transactions: [],
          lastUsed: Date.now() // إضافة توقيت آخر استخدام
      });
      closeAddCustomerModal();
      loadCustomers();
  } catch (error) {
      alert('خطأ في إضافة الزبون: ' + error.message);
  }
};

//////////////////////////////






window.loadCustomers = async () => {
  const q = query(
    collection(db, "stores", currentUser.uid, "customers"),
    orderBy("lastUsed", "desc")
  );

  const querySnapshot = await getDocs(q);
  const customers = [];

  querySnapshot.forEach(doc => {
    customers.push({ id: doc.id, ...doc.data() });
  });

  const list = document.getElementById('customersList');
  list.innerHTML = '';

  customers.forEach(data => {
    const li = document.createElement('li');
    li.className = 'customer-item';
    li.innerHTML = `
      <div class="customer-info">
        <h4>${data.name}</h4>
        <p style="color: ${data.balance >= 0 ? 'var(--success)' : 'var(--danger)'}">
          ${data.balance} ليرة
        </p>
      </div>
      <div class="customer-actions">
        <button class="copy-btn" onclick="generateLink('${data.customerId}', '${currentUser.uid}'); event.stopPropagation()">
          <i class="fas fa-link"></i>
        </button>
        <button class="btn1" onclick="deleteCustomer('${data.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    li.onclick = async () => {
      await updateDoc(doc(db, "stores", currentUser.uid, "customers", data.id), {
        lastUsed: new Date()
      });
      showCustomerDetails(data.id, data);
      loadCustomers();
    };
    
    list.appendChild(li);
  });
};












//عدد الزبائن
document.addEventListener('DOMContentLoaded', () => {
  const targetNode = document.getElementById('customersList');
  if (!targetNode) return;  // التأكد من وجود العنصر

  const config = { childList: true, subtree: true };

  const observer = new MutationObserver(() => {
    document.getElementById('counter').textContent = document.querySelectorAll('#customersList li').length;
  });

  // بدء المراقبة
  observer.observe(targetNode, config);
});





//////////////////////////////////////
//اجمالي الديون
// إنشاء الكود داخل setTimeout لتحديث الحساب بعد 3 ثواني
setTimeout(() => {
  const h4Elements = document.querySelectorAll('#customersList li p');
  let totalValue = 0;

  // حساب مجموع القيم داخل p
  h4Elements.forEach(p => {
    totalValue += parseFloat(p.textContent) || 0;  // جمع القيم داخل p (تجاهل العناصر غير الرقمية)
  });

  // عرض النتيجة في العنصر counter2
  document.getElementById('counter2').textContent = totalValue;
}, 0);

// مراقبة التغيرات داخل قائمة li
const targetNode = document.getElementById('customersList');
const config = { childList: true, subtree: true, characterData: true };

// إنشاء observer لمراقبة التغيرات
const observer = new MutationObserver(() => {
  const h4Elements = document.querySelectorAll('#customersList li p');
  let totalValue = 0;

  // حساب مجموع القيم داخل p
  h4Elements.forEach(p => {
    totalValue += parseFloat(p.textContent) || 0;  // جمع القيم داخل p
  });

  // عرض النتيجة في العنصر counter2
  document.getElementById('counter2').textContent = totalValue;
});

// بدء المراقبة
observer.observe(targetNode, config);
//////////////////////////////////////////////



















  // حذف زبون
  window.deleteCustomer = async (customerId) => {
    if (!confirm('هل تريد حذف هذا الزبون؟')) return;
    
    try {
        await deleteDoc(doc(db, "stores", currentUser.uid, "customers", customerId));
        loadCustomers();
        if (selectedCustomer === customerId) {
            closeCustomerDetails();
        }
    } catch (error) {
        alert('خطأ في حذف الزبون: ' + error.message);
    }
};





    // عرض تفاصيل الزبون
    async function showCustomerDetails(customerId, customerData) {
      selectedCustomer = customerId;
      document.getElementById('customerDetails').style.display = 'block';
      document.getElementById('selectedCustomerName').textContent = ('الأسم : ')+customerData.name;
      loadTransactions(customerData.transactions);
  }






    // إضافة معاملة
    window.addTransaction = async (type) => {
      const amount = parseFloat(document.getElementById('amountInput').value);
      if (isNaN(amount) || amount <= 0) {
          alert('يرجى إدخال مبلغ صحيح');
          return;
      }
      
      const customerRef = doc(db, "stores", currentUser.uid, "customers", selectedCustomer);
      const transaction = {
          type: type,
          amount: amount,
          date: new Date().toISOString()
      };
      
      try {
          await updateDoc(customerRef, {
              balance: increment(type === 'credit' ? amount : -amount),
              transactions: arrayUnion(transaction)
          });
          document.getElementById('amountInput').value = '';
          loadCustomers();
          const customerSnap = await getDoc(customerRef);
          loadTransactions(customerSnap.data().transactions);
      } catch (error) {
          alert('خطأ في إضافة المعاملة: ' + error.message);
      }
  };

  // تحميل المعاملات
  async function loadTransactions(transactions) {
      const list = document.getElementById('transactionsList');
      list.innerHTML = '';
      
      transactions.reverse().forEach((transaction, index) => {
          const li = document.createElement('li');
          li.className = 'transaction-item';
          li.innerHTML = `
              <div>
                  <span style="color: ${transaction.type === 'credit' ? 'var(--dark)' : 'var(--danger)'}">
                      ${transaction.type === 'credit' ? '+' : '-'}${transaction.amount} ليرة
                  </span>
                  <small>${new Date(transaction.date).toLocaleDateString()}</small>
              </div>
              <div>
                  <button class="btn1 btn-danger" onclick="deleteTransaction(${index})">
                      <i class="fas fa-trash"></i>
                  </button>
              </div>
          `;
          list.appendChild(li);
      });
  }

  // حذف معاملة
  window.deleteTransaction = async (index) => {
      if (!confirm('هل تريد حذف هذه المعاملة؟')) return;
      
      const customerRef = doc(db, "stores", currentUser.uid, "customers", selectedCustomer);
      const customerSnap = await getDoc(customerRef);
      const transactions = customerSnap.data().transactions;
      const reversedIndex = transactions.length - 1 - index;
      const transaction = transactions[reversedIndex];
      
      try {
          await updateDoc(customerRef, {
              balance: increment(transaction.type === 'credit' ? -transaction.amount : transaction.amount),
              transactions: arrayRemove(transaction)
          });
          
          loadTransactions((await getDoc(customerRef)).data().transactions);
          loadCustomers();
      } catch (error) {
          alert('خطأ في حذف المعاملة: ' + error.message);
      }
  };








   // إدارة الواجهة




window.showAddCustomerModal = () => {
    document.getElementById('addCustomerModal').style.display = 'flex';
}

window.closeAddCustomerModal = () => {
    document.getElementById('addCustomerModal').style.display = 'none';
    document.getElementById('newCustomerName').value = '';
}


 // دعم زر Enter
 window.handleEnter = (e) => {
  if (e.key === 'Enter') addTransaction('credit');
};





// عند تحميل الصفحة مباشرة
const urlParams = new URLSearchParams(window.location.search);
const customerId = urlParams.get('customerId');

if (customerId && !window.user) { // إذا كان الرابط يحتوي على customerId
  showCustomerDetails(customerId); // اعرض تفاصيل الدين مباشرة
  document.getElementById('authSection').style.display = 'none'; // اخفي تسجيل الدخول
}

// إنشاء رابط التتبع عند النقر على اسم الزبون
async function generateLink(customerId) {
  const baseUrl = window.location.href.split('#')[0]; // الحصول على رابط الموقع الحالي
  const trackingLink = `${baseUrl}?customerId=${customerId}`;
  
  try {
    await navigator.clipboard.writeText(trackingLink);
    alert('تم نسخ رابط التتبع!');
  } catch (err) {
    prompt('انسخ الرابط يدويًا:', trackingLink);
  }
}

// تعديل دالة عرض الزبائن لإضافة الرابط
function renderCustomers(customers) {
  const list = document.getElementById('customersList');
  list.innerHTML = customers.map(cust => `
    <li onclick="showCustomerDetails('${cust.id}')">
      ${cust.name} 
      <small>${cust.debt} ل.س</small>
      <button class="copy-btn" onclick="generateLink('${cust.id}'); event.stopPropagation()">
        <i class="fas fa-copy"></i>
      </button>
    </li>
  `).join('');
}
