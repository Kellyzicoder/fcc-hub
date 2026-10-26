// Public values only (safe to ship in the browser). Data is protected by Row Level Security.
// Same Supabase project as the attendance app and the new converts form, so people use the same sign-in.
window.FCC_CONFIG = {
  supabaseUrl: "https://pgqckklzvqvjmqyxzkvz.supabase.co",
  supabaseKey: "sb_publishable_iPbJ3OYuDmdd51QD_cK3Ng_ip7CU_0z",
  churchName: "Favourite Child Church",

  // Where each app lives. Change a link here and the hub uses it everywhere.
  links: {
    attendance: "https://fcc-welcome.vercel.app/app/index.html",
    firstTimers: "https://fcc-welcome.vercel.app",                 // the welcome form (QR code on the table)
    newConverts: "https://fcc-new-converts.vercel.app",            // the new converts form
    newConvertsList: "https://fcc-new-converts.vercel.app/leaders", // leaders' list of new converts
    livestream: "https://fcclive.vercel.app",
  },

  // Which roles see which app. Roles come from the attendance app:
  // admin = Admin, bishop = Bishop, lead = Church admin, team = Team (usher), pastor = Pastor
  access: {
    attendance: ["admin", "bishop", "lead", "team", "pastor"],
    firstTimers: ["admin", "lead", "team"],
    newConverts: ["admin", "lead", "team", "pastor"],
    livestream: ["admin", "bishop", "lead", "team", "pastor"],
  },
};
