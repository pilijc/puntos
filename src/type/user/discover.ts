export const storeIconKey = (type: string | number) => {
    const t = String(type).toLowerCase();
    switch (t) {
      case "bar":
        return "bar";
      case "coffee":
        return "coffee";
      case "restaurant":
        return "restaurant";
      case "market":
        return "market";
      case "shop":
      default:
        return "default";
    }
  };