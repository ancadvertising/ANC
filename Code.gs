// وظيفة تشغيل التطبيق وعرض الواجهة الرئيسية
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('نظام إدارة المهام والصلاحيات - ANC')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// محاكاة جلب بيانات المستخدم الحالي وصلاحياته (يمكن ربطها بنظام تسجيل الدخول الخاص بك)
// الأدوار المتاحة: 'Admin', 'Project Manager', 'Team Member'
function getCurrentUserContext() {
  var email = Session.getActiveUser().getEmail();
  
  // يمكنك هنا وضع منطق لجلب دور المستخدم الحقيقي من شيت المستخدمين، حالياً سنفترض جدلاً بناءً على البريد أو كـ تجربة:
  var role = "Team Member"; 
  if (email === "admin@yourdomain.com" || email === "") { // الافتراضي للتجربة admin
    role = "Admin";
  }
  
  return {
    email: email || "user@anc-agency.com",
    role: role
  };
}

// جلب المهام بناءً على صلاحية الدور الحالية للمستخدم
function getTasksForUser() {
  var userContext = getCurrentUserContext();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tasks");
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var tasks = [];
  
  for (var i = 1; i < data.length; i++) {
    var task = {};
    for (var j = 0; j < headers.length; j++) {
      task[headers[j].toString().replace(/\s+/g, '')] = data[i][j];
    }
    
    // تطبيق نظام الصلاحيات (RBAC Filter)
    if (userContext.role === "Admin" || userContext.role === "Project Manager") {
      // المدير والمشرف يريان كل المهام
      tasks.push(task);
    } else if (userContext.role === "Team Member" && task.AssignedTo === userContext.email) {
      // عضو الفريق يرى فقط المهام المعينة له بريدياً
      tasks.push(task);
    }
  }
  return tasks;
}

// إضافة أو تعديل مهمة (صلاحية Admin و Project Manager فقط)
function saveTask(taskData) {
  var userContext = getCurrentUserContext();
  if (userContext.role !== "Admin" && userContext.role !== "Project Manager") {
    throw new Error("عذراً، لا تمتلك الصلاحية الكافية لإضافة أو تعديل المهام.");
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tasks");
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet("Tasks");
    sheet.appendRow(['Task ID', 'Task Title', 'Description', 'Assigned To', 'Role Required', 'Status', 'Deadline', 'Created By']);
  }
  
  if (taskData.id) {
    // تعديل مهمة قائمة
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === taskData.id.toString()) {
        sheet.getRange(i + 1, 2, 1, 6).setValues([[
          taskData.title,
          taskData.description,
          taskData.assignedTo,
          taskData.roleRequired,
          taskData.status,
          taskData.deadline
        ]]);
        return "تم تحديث المهمة بنجاح";
      }
    }
  } else {
    // إضافة مهمة جديدة
    var taskId = "TSK-" + Math.floor(100000 + Math.random() * 900000);
    sheet.appendRow([
      taskId,
      taskData.title,
      taskData.description,
      taskData.assignedTo,
      taskData.roleRequired,
      taskData.status,
      taskData.deadline,
      userContext.email
    ]);
    return "تم إضافة المهمة بنجاح بـ ID: " + taskId;
  }
}

// تحديث حالة المهمة فقط (متاحة لعضو الفريق للمهام الخاصة به)
function updateTaskStatus(taskId, newStatus) {
  var userContext = getCurrentUserContext();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Tasks");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === taskId.toString()) {
      var assignedTo = data[i][3];
      
      // التحقق من الصلاحية قبل التعديل
      if (userContext.role === "Admin" || userContext.role === "Project Manager" || assignedTo === userContext.email) {
        sheet.getRange(i + 1, 6).setValue(newStatus); // عمود الـ Status هو الـ 6
        return "تم تحديث حالة المهمة بنجاح";
      } else {
        throw new Error("لا تملك صلاحية لتحديث هذه المهمة.");
      }
    }
  }
  throw new Error("المهمة غير موجودة.");
}
