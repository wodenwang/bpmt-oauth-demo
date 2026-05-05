function confirmDelete(event) {
  if (!window.confirm('确认删除这条留言？')) {
    event.preventDefault();
  }
}

function toggleFilterPanel() {
  const panel = document.querySelector('[data-filter-panel]');
  if (!panel) {
    return;
  }
  panel.toggleAttribute('data-open');
}

document.querySelectorAll('[data-confirm-delete]').forEach((form) => {
  form.addEventListener('submit', confirmDelete);
});

document.querySelectorAll('[data-toggle-filter]').forEach((button) => {
  button.addEventListener('click', toggleFilterPanel);
});
