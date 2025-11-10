export default class AboutPage {
  async render() {
    return `
      <section class="container">
        <h1>About This App</h1>
        <article class="about-content">
          <p>
            Ini adalah aplikasi "Story App" yang dibuat sebagai 
            tugas submission untuk kelas Menjadi Web Developer Expert.
          </p>
          <p>
            Dibuat oleh: <strong>Jessica Andryani</strong>
          </p>
        </article>
      </section>
    `;
  }
  async afterRender() {
    // Tidak ada logika khusus yang perlu dijalankan setelah render
  }
}
