<template>
  <div class="files-page">
    <section class="page-header">
      <h1 class="page-title">文件与资源</h1>
      <p class="page-desc">课件下发、资源管理（功能开发中）</p>
    </section>

    <section class="card empty-card">
      <div class="empty-icon">📁</div>
      <h3 class="empty-title">即将上线</h3>
      <p class="empty-desc">后续将支持接收课件、图片等资源文件，并在教室端展示或下载。</p>
    </section>
  </div>
</template>

<style scoped>
.files-page {
  max-width: 760px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
}

.page-desc {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.card {
  padding: 48px 24px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef3;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
}

.empty-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #6b7280;
}
</style>
