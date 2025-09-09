// Simple SPA router: show/hide sections and keep active link
export function initRouter(){
  const links = document.querySelectorAll(".admin-sidebar a[data-section]");
  const sections = document.querySelectorAll(".admin-section");

  const go = (id) => {
    sections.forEach(s => s.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
    links.forEach(x => x.classList.toggle("active", x.dataset.section === id));
  };

  // click nav
  links.forEach(a => a.addEventListener("click", (e)=>{
    e.preventDefault();
    const id = a.dataset.section;
    history.pushState({section:id}, "", `#${id}`);
    go(id);
  }));

  // on load / back-forward
  window.addEventListener("popstate", ()=>{
    const id = (location.hash||"#dashboard").substring(1);
    go(id);
  });

  // first load
  const start = (location.hash||"#dashboard").substring(1);
  go(start);
}
