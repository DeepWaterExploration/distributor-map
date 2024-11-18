export const styles = {
  pageContainer: {
    width: "100%",
    height: "100vh",
    background: "#262626"
  },

  mapContainer: {
    minWidth: "350px",
    width: "100%",

    height: "calc(100% - ( 1px / 1000))", //Full screen minus a miniscule amount

    padding: "10px",
  },
} as const;
