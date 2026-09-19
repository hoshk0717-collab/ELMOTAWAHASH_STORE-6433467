ملفات ELMOTAWAHASH_STORE
========================

1. index.html
2. style.css
3. app.js
4. firebase.js
5. firestore.rules
6. storage.rules
7. config.example.json

المزايا:
- تسجيل الدخول بحساب Google.
- حساب عميل في Firestore.
- منتجات وخدمات.
- إنشاء طلب.
- رقم المحفظة 01010192817.
- إدخال رقم التحويل والمبلغ.
- رفع Screenshot لإثبات التحويل إلى Firebase Storage.
- مركز تحكم للمشرف.
- توثيق / إلغاء توثيق المستخدم.
- حظر / إلغاء حظر المستخدم.
- إحصائيات المستخدمين والطلبات والمنتجات.
- قبول / رفض الطلبات.
- رابط لإثبات التحويل.

إعداد المشرف:
أنشئ في Firestore مستند:
settings/main
واجعل:
{
  "adminEmails": ["YOUR_GMAIL@gmail.com"]
}

فعّل:
Authentication > Sign-in method > Google
ثم أنشئ Firestore Database وStorage.

ملاحظة مهمة جداً عن التحقق التلقائي من المحفظة:
المتصفح لا يستطيع قراءة رسائل Vodafone Cash / المحافظ من هاتفك مباشرة بطريقة آمنة.
لعمل التحقق التلقائي الحقيقي، تحتاج API/Webhook من مزود المحفظة أو خدمة وسيطة/سيرفر يستقبل إشعار التحويل ثم يحدّث Firestore.
الكود الحالي يترك التحقق النهائي للمشرف، وهو المسار الآمن الجاهز للعمل بدون ادعاء تحقق غير حقيقي.

قبل النشر التجاري:
- لا تجعل Rules مفتوحة.
- فعّل App Check.
- قيّد Storage.
- استخدم Cloud Functions/server للتحقق من المدفوعات إن توفر API رسمي.
