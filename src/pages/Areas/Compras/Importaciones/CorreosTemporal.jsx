//PRICING
const correosDestinatariosPricingDEV = [
  {
    correo: "tecnologia2@autollanta.com",
    empresas: [
      {
        EMPRESA: "MAXXIMUNDO",
        MARCAS: ["APLUS", "HAOHUA", "ROADCRUZA", "MAXXIS", "KEYSTONE", "SHELL"],
      },
      {
        EMPRESA: "STOX",
        MARCAS: ["BAYI", "ANSU", "BYCROSS", "WONDERLAND", "CST"],
      },
    ],
  },
  {
    correo: "tecnologia1@autollanta.com",
    empresas: [
      {
        EMPRESA: "AUTOLLANTA",
        MARCAS: ["FORTUNE", "MAXTREK"],
      },
      {
        EMPRESA: "STOX",
        MARCAS: ["ANTARES", "FARROAD BRAND"],
      },
    ],
  },
  {
    correo: "tecnologia3@autollanta.com",
    empresas: [
      {
        EMPRESA: "MAXXIMUNDO",
        MARCAS: ["FSL", "UYUSTOOLS"],
      },
    ],
  },
];
const correosDestinatariosPricingPROD = [
  {
    correo: "juanpablo@maxximundo.com",
    empresas: [
      {
        EMPRESA: "MAXXIMUNDO",
        MARCAS: ["APLUS", "HAOHUA", "ROADCRUZA", "MAXXIS", "KEYSTONE", "SHELL"],
      },
      {
        EMPRESA: "STOX",
        MARCAS: ["BAYI", "ANSU", "BYCROSS", "WONDERLAND", "CST"],
      },
    ],
  },
  {
    correo: "santiagov@autollanta.com",
    empresas: [
      {
        EMPRESA: "AUTOLLANTA",
        MARCAS: ["FORTUNE", "MAXTREK"],
      },
      {
        EMPRESA: "STOX",
        MARCAS: ["ANTARES", "FARROAD BRAND"],
      },
    ],
  },
  {
    correo: "jamora@ikonix.ec",
    empresas: [
      {
        EMPRESA: "MAXXIMUNDO",
        MARCAS: ["FSL", "UYUSTOOLS"],
      },
    ],
  },
];

//BODEGA
const herramientasEmpresa = [
  {
    EMPRESA: "MAXXIMUNDO",
    MARCAS: ["FSL", "UYUSTOOLS", "SHELL"],
  },
];
const llantasEmpresa = [
  {
    EMPRESA: "AUTOLLANTA",
    MARCAS: ["FORTUNE", "MAXTREK"],
  },
  {
    EMPRESA: "MAXXIMUNDO",
    MARCAS: ["APLUS", "HAOHUA", "ROADCRUZA", "MAXXIS", "KEYSTONE", "CST"],
  },
  {
    EMPRESA: "STOX",
    MARCAS: [
      "ANSU",
      "ANTARES",
      "BAYI",
      "BYCROSS",
      "CST",
      "WONDERLAND",
      "FARROAD BRAND",
    ],
  },
];
const correosDestinatariosBodegaDEV = [
  {
    correo: "tecnologia2@autollanta.com",
    empresas: herramientasEmpresa,
  },
  {
    correo: "tecnologia1@autollanta.com",
    empresas: herramientasEmpresa,
  },
  {
    correo: "tecnologia3@autollanta.com",
    empresas: llantasEmpresa,
  },
];
const correosDestinatariosBodegaPROD = [
  {
    correo: "logisticacedis2@maxximundo.com",
    empresas: herramientasEmpresa,
  },
  {
    correo: "logisticacedis@ikonix.ec",
    empresas: herramientasEmpresa,
  },
  {
    correo: "logisticacedis@autollanta.com",
    empresas: llantasEmpresa,
  },
  {
    correo: "bodega1@maxximundo.com",
    empresas: llantasEmpresa,
  },
  {
    correo: "bodega@autollanta.com",
    empresas: llantasEmpresa,
  },
];

export const listCorreosEnvioPricing = () => {
  const var1 =
    import.meta.env.MODE === "development"
      ? correosDestinatariosPricingDEV
      : correosDestinatariosPricingPROD;
  return var1;
};

export const listCorreosEnvioBodega = () => {
  const var1 =
    import.meta.env.MODE === "development"
      ? correosDestinatariosBodegaDEV
      : correosDestinatariosBodegaPROD;
  return var1;
};

