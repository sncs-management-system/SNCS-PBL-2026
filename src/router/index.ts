import { createRouter, createWebHistory } from "vue-router";
import AboutView from "@/views/AboutView.vue";
import CampusView from "@/views/CampusView.vue";
import ContactView from "@/views/ContactView.vue";
import EventsView from "@/views/EventsView.vue";
import HomeView from "@/views/HomeView.vue";
import NewsView from "@/views/NewsView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: "/enrollment", name: "enrollment", component: () => import("@/views/EnrollmentView.vue"), meta: { title: "Enrollment application" } },
    { path: "/", name: "home", component: HomeView, meta: { title: "Home" } },
    { path: "/about", name: "about", component: AboutView, meta: { title: "About" } },
    { path: "/campus", name: "campus", component: CampusView, meta: { title: "Campus" } },
    { path: "/news", name: "news", component: NewsView, meta: { title: "News" } },
    { path: "/events", name: "events", component: EventsView, meta: { title: "Events" } },
    { path: "/contact", name: "contact", component: ContactView, meta: { title: "Contact" } },
  ],
});

router.afterEach((to) => {
  const title = typeof to.meta.title === "string" ? `${to.meta.title} | ` : "";
  document.title = `${title}Sto. Niño Catholic School, Inc.`;
});

export default router;
