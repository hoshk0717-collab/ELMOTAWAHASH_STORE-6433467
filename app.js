import { loginGoogle,logout,watchAuth,ensureUser,getProducts,addProduct,getMyOrders,uploadProof,createOrder,getUsers,getOrders,updateUser,updateOrder,getSettings } from "./firebase.js";

const $=id=>document.getElementById(id);
let currentUser=null,currentProfile=null,products=[],settings={};

$("loginBtn").onclick=()=>loginGoogle().catch(e=>alert("تعذر تسجيل الدخول: "+e.message));
$("logoutBtn").onclick=()=>logout();

watchAuth(async user=>{
  currentUser=user;
  $("loginBtn").hidden=!!user;
  $("logoutBtn").hidden=!user;
  $("userName").textContent=user?(user.displayName||user.email):"زائر";

  if(user){
    currentProfile=await ensureUser(user);
    if(currentProfile.banned){showBanned();return}
  }

  await loadProducts();
  await loadMyOrders();
  await checkAdmin();
});

async function loadProducts(){
  try{
    products=await getProducts();
    renderProducts();
  }catch(e){
    $("productsGrid").innerHTML="<p class='muted'>تعذر تحميل المنتجات. راجع Firestore Rules.</p>";
  }
}

function renderProducts(){
  $("productsGrid").innerHTML=products
    .filter(p=>p.active!==false)
    .map(p=>`
      <article class="card">
        ${p.image
          ? `<img src="${esc(p.image)}">`
          : `<div style="height:180px;display:grid;place-items:center;font-size:70px">🐺</div>`
        }

        <small>ELMOTAWAHASH_STORE</small>
        <h3>${esc(p.name)}</h3>
        <p class="muted">${esc(p.description||"خدمة رقمية احترافية")}</p>
        <div class="price">${money(p.price)} ج.م</div>
        <button class="cta" data-buy="${p.id}">اطلب الآن</button>
      </article>
    `).join("");

  document.querySelectorAll("[data-buy]").forEach(
    b=>b.onclick=()=>startOrder(products.find(p=>p.id===b.dataset.buy))
  );
}

function startOrder(p){
  if(!currentUser){
    alert("سجل الدخول بحساب Google أولاً.");
    return;
  }

  if(currentProfile?.banned){
    showBanned();
    return;
  }

  $("modalTitle").textContent="طلب: "+p.name;

  $("modalInfo").innerHTML=
    `السعر: <b>${money(p.price)} ج.م</b><br>
     حوّل المبلغ إلى المحفظة <b>01010192817</b> ثم أرسل بيانات التحويل.`;

  $("modal").hidden=false;

  $("orderForm").dataset.product=
    JSON.stringify({
      id:p.id,
      name:p.name,
      price:p.price
    });
}

$("closeModal").onclick=()=>$("modal").hidden=true;

$("orderForm").onsubmit=async e=>{
  e.preventDefault();

  if(!currentUser)return;

  const p=JSON.parse(e.target.dataset.product);
  const file=$("proofFile").files[0];

  if(Number($("transferAmount").value)!==Number(p.price)){
    alert("المبلغ المدخل لا يساوي سعر الطلب.");
    return;
  }

  try{
    const proof=await uploadProof(file,currentUser.uid);

    await createOrder({
      uid:currentUser.uid,
      email:currentUser.email,
      productId:p.id,
      productName:p.name,
      price:p.price,
      transferFrom:$("transferFrom").value,
      transferAmount:Number($("transferAmount").value),
      proofUrl:proof
    });

    $("modal").hidden=true;
    e.target.reset();

    await loadMyOrders();

    alert("تم إرسال الطلب للمراجعة. سيتم تأكيده بعد التحقق من التحويل.");
  }catch(err){
    alert("تعذر إرسال الطلب: "+err.message);
  }
};

async function loadMyOrders(){
  if(!currentUser){
    $("ordersList").innerHTML=
      "<p class='muted'>سجل دخولك لعرض طلباتك.</p>";
    return;
  }

  try{
    const os=await getMyOrders(currentUser.uid);

    $("ordersList").innerHTML=os.length
      ? os.map(o=>`
          <div class="order">
            <b>${esc(o.productName)}</b><br>
            المبلغ: ${money(o.price)} ج.م<br>
            الحالة: ${esc(o.status||"pending")}
            |
            الدفع: ${esc(o.paymentStatus||"pending")}
          </div>
        `).join("")
      : "<p class='muted'>لا توجد طلبات حتى الآن.</p>";

  }catch(e){
    $("ordersList").innerHTML=
      "<p class='muted'>تعذر قراءة الطلبات.</p>";
  }
}

async function checkAdmin(){
  settings=await getSettings().catch(()=>({}));

  const isAdmin=
    !!currentUser &&
    Array.isArray(settings.adminEmails) &&
    settings.adminEmails.includes(currentUser.email);

  $("adminGate").hidden=isAdmin;
  $("adminPanel").hidden=!isAdmin;

  if(isAdmin)loadAdmin();
}

$("productForm").onsubmit=async e=>{
  e.preventDefault();

  try{
    await addProduct(
      $("pName").value,
      $("pPrice").value,
      $("pImage").value,
      $("pDesc").value
    );

    e.target.reset();
    await loadProducts();

    alert("تمت إضافة المنتج.");
  }catch(err){
    alert(err.message);
  }
};

async function loadAdmin(){
  const [users,orders]=await Promise.all([
    getUsers(),
    getOrders()
  ]);

  $("usersCount").textContent=users.length;
  $("ordersCount").textContent=orders.length;
  $("productsCount").textContent=products.length;

  $("usersList").innerHTML=users.map(u=>`
    <div class="user-row">
      <span>
        ${esc(u.email||u.uid)}
        ${u.verified?"✅":""}
      </span>

      <span>
        <button
          class="${u.verified?'danger':'verify'}"
          data-verify="${u.uid}">
          ${u.verified?"إلغاء التوثيق":"توثيق"}
        </button>

        <button
          class="${u.banned?'verify':'danger'}"
          data-ban="${u.uid}">
          ${u.banned?"إلغاء الحظر":"حظر"}
        </button>
      </span>
    </div>
  `).join("");

  document.querySelectorAll("[data-verify]").forEach(b=>{
    b.onclick=async()=>{
      await updateUser(
        b.dataset.verify,
        {verified:b.textContent.includes("توثيق")}
      );
      loadAdmin();
    };
  });

  document.querySelectorAll("[data-ban]").forEach(b=>{
    b.onclick=async()=>{
      await updateUser(
        b.dataset.ban,
        {banned:b.textContent==="حظر"}
      );
      loadAdmin();
    };
  });

  $("adminOrders").innerHTML=orders.map(o=>`
    <div class="admin-order">
      <span>
        <b>${esc(o.productName)}</b><br>
        ${esc(o.email||"")}<br>
        ${money(o.price)} ج.م<br>
        <a
          href="${esc(o.proofUrl||"#")}"
          target="_blank">
          عرض إثبات التحويل
        </a>
      </span>

      <span>
        <button
          class="verify"
          data-accept="${o.id}">
          قبول
        </button>

        <button
          class="danger"
          data-reject="${o.id}">
          رفض
        </button>
      </span>
    </div>
  `).join("");

  document.querySelectorAll("[data-accept]").forEach(b=>{
    b.onclick=async()=>{
      await updateOrder(
        b.dataset.accept,
        {
          status:"accepted",
          paymentStatus:"verified"
        }
      );
      loadAdmin();
    };
  });

  document.querySelectorAll("[data-reject]").forEach(b=>{
    b.onclick=async()=>{
      await updateOrder(
        b.dataset.reject,
        {
          status:"rejected",
          paymentStatus:"rejected"
        }
      );
      loadAdmin();
    };
  });
}

function showBanned(){
  alert(
    "تم حظر حسابك. لفك حظر حسابك يرجى التواصل مع رقم 01010192817\nELMOTAWAHASH_STORE"
  );
}

function money(v){
  return new Intl.NumberFormat("ar-EG").format(Number(v)||0);
}

function esc(v=""){
  return String(v).replace(
    /[&<>"']/g,
    c=>({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"
    }[c])
  );
}