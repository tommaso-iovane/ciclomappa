<script>
  import { toasts } from './toast.js';
  import { fly } from 'svelte/transition';

  function getAlertClass(type) {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      default:
        return 'alert-info';
    }
  }

</script>

<div class="toast toast-top toast-end z-50">
  {#each $toasts as toast (toast.id)}
    <div class="alert {getAlertClass(toast.type)}" in:fly={{ y: -20, duration: 300 }} out:fly={{ y: -20, duration: 300 }}>
      <span>{toast.message}</span>
    </div>
  {/each}
</div>
