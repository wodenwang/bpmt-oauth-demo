function dialog() {
  return document.getElementById('message-dialog');
}

async function loadDialog(url) {
  const response = await fetch(url, { headers: { Accept: 'text/html' } });
  if (!response.ok) {
    window.alert('加载留言窗口失败，请稍后重试');
    return;
  }
  const html = await response.text();
  const element = dialog();
  element.innerHTML = html;
  element.showModal();
}

function openCreateDialog() {
  const element = dialog();
  element.innerHTML = `
    <form method="post" action="/messages" class="modal-form">
      <div class="modal-title">新增留言</div>
      <label for="create-message-title">标题</label>
      <input id="create-message-title" name="title" maxlength="200" required>
      <label for="create-message-content">内容</label>
      <textarea id="create-message-content" name="content" rows="8" required></textarea>
      <div class="modal-actions">
        <button type="submit" class="toolbar-button primary">保存</button>
        <button type="button" class="toolbar-button" onclick="closeDialog()">关闭</button>
      </div>
    </form>`;
  element.showModal();
}

function openViewDialog(id) {
  loadDialog(`/messages/${encodeURIComponent(id)}`);
}

function openEditDialog(id) {
  loadDialog(`/messages/${encodeURIComponent(id)}?mode=edit`);
}

function closeDialog() {
  const element = dialog();
  if (element?.open) {
    element.close();
  }
}

function deleteOne(id) {
  if (!window.confirm('确认删除这条留言？')) {
    return;
  }
  const form = document.getElementById('delete-form');
  form.action = `/messages/${encodeURIComponent(id)}/delete`;
  form.submit();
}

function toggleAllRows(source) {
  document.querySelectorAll('input[name="ids"]:not(:disabled)').forEach((checkbox) => {
    checkbox.checked = source.checked;
  });
}

function confirmBulkDelete() {
  const checked = document.querySelectorAll('input[name="ids"]:checked');
  if (checked.length === 0) {
    window.alert('请先选择可删除的留言');
    return false;
  }
  return window.confirm(`确认删除选中的 ${checked.length} 条留言？`);
}

Object.assign(window, {
  openCreateDialog,
  openViewDialog,
  openEditDialog,
  closeDialog,
  deleteOne,
  toggleAllRows,
  confirmBulkDelete
});
