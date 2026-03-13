export type StoreItem = {
  id: string;
  name: string;
  location: string;
  distanceMeters: number;
  points: number;
  isNearby?: boolean;
  isCheckedInToday?: boolean;
  logo?: string | null;
};

export type RewardStatus = "redeem" | "insufficient";

export type RewardItem = {
  id: string;
  storeId: string;
  title: string;
  desc: string;
  imageUrl?: string;
  points: number;
  status: RewardStatus;
  popularity: number;
  createdAt: string;
};

export const stores: StoreItem[] = [
  {
    id: "coffee-foundry",
    name: "The Coffee Foundry",
    location: "Brooklyn, NY",
    distanceMeters: 322,
    points: 860,
    isNearby: true,
    isCheckedInToday: false,
  },
  {
    id: "bean-lab",
    name: "Bean Lab",
    location: "Williamsburg, NY",
    distanceMeters: 1770,
    points: 420,
    isNearby: true,
    isCheckedInToday: true,
  },
  {
    id: "harbor-roast",
    name: "Harbor Roast",
    location: "DUMBO, NY",
    distanceMeters: 3862,
    points: 140,
    isNearby: true,
    isCheckedInToday: true,
  },
];

export const storeLogos: Record<string, any> = {
  "coffee-foundry": require("../assets/images/rewards/store_logo/coffee-foundry-logo.png"),
  "bean-lab": require("../assets/images/rewards/store_logo/bean-lab-logo.png"),
  "harbor-roast": require("../assets/images/rewards/store_logo/harbor-roast-logo.png"),
};

export const rewards: RewardItem[] = [
  {
    id: "coffee",
    storeId: "coffee-foundry",
    title: "Free Specialty Coffee",
    desc: "Any medium size brew",
    imageUrl:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29mZmVlJTIwY3VwfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000",
    points: 500,
    status: "redeem",
    popularity: 1,
    createdAt: "2026-02-10",
  },
  {
    id: "pastry",
    storeId: "coffee-foundry",
    title: "Morning Pastry",
    desc: "Choice of croissant or muffin",
    imageUrl:
      "https://images.unsplash.com/photo-1759566926618-163d14e00fc8?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    points: 350,
    status: "redeem",
    popularity: 2,
    createdAt: "2026-02-08",
  },
  {
    id: "beans",
    storeId: "coffee-foundry",
    title: "250g Whole Bean Bag",
    desc: "House roast signature blend",
    imageUrl:
      "https://cdn.pixabay.com/photo/2018/02/09/22/06/coffee-3142560_1280.jpg",
    points: 1200,
    status: "insufficient",
    popularity: 3,
    createdAt: "2026-01-28",
  },
  {
    id: "latte-art",
    storeId: "bean-lab",
    title: "Latte Art Class",
    desc: "One-hour workshop session",
    imageUrl:
      "https://images.unsplash.com/photo-1524671710025-d79530c2f957?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
    points: 900,
    status: "insufficient",
    popularity: 2,
    createdAt: "2026-02-12",
  },
  {
    id: "tasting-flight",
    storeId: "harbor-roast",
    title: "Tasting Flight",
    desc: "Three single-origin pours",
    imageUrl:
      "https://images.pexels.com/photos/34505585/pexels-photo-34505585.jpeg?cs=srgb&dl=pexels-alinaskazka-34505585.jpg&fm=jpg",
    points: 650,
    status: "redeem",
    popularity: 1,
    createdAt: "2026-02-05",
  },
];
