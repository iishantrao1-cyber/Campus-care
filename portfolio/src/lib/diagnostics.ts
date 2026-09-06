/**
 * Last-resort visibility: any uncaught error or promise rejection shows a
 * small banner so the site never fails to a silent black screen.
 */
export function installDiagnostics() {
  let hideTimer: number | undefined
  const show = (msg: string) => {
    let el = document.getElementById('diag') as HTMLElement | null
    if (!el) {
      el = document.createElement('div')
      el.id = 'diag'
      el.setAttribute('role', 'alert')
      document.body.appendChild(el)
    }
    el.textContent = `⚠ ${msg}`
    el.classList.add('show')
    window.clearTimeout(hideTimer)
    hideTimer = window.setTimeout(() => el?.classList.remove('show'), 25000)
  }
  window.addEventListener('error', (e) => {
    if (e.message) show(e.message)
  })
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason as { message?: string } | null
    show(reason?.message ?? String(e.reason))
  })
}
