export type ContractReviewColumn = {
  header: string;
  accessor: string;
  defaultWidth: number;
  align?: "left" | "right" | "center";
  sticky?: boolean;
  sortable?: boolean;
  children?: { header: string; label: string }[];
};

export const CONTRACT_REVIEW_COLUMN_GROUPS = [
  {
    label: "Contract / PO NO",
    width: 240,
    children: [
      { header: "CONTRACT NO", label: "Contract NO" },
      { header: "PO NO", label: "PO NO" },
    ],
  },
  {
    label: "Item Names/Party Item Names",
    width: 300,
    children: [
      { header: "ITEM_NAME", label: "Item Name -" },
      { header: "PARTY ITEM NAME", label: "Party Item Name -" },
    ],
  },
  {
    label: "Item / Size / PN RATING",
    width: 340,
    children: [
      { header: "Item", label: "Item -" },
      { header: "SIZE", label: "Size -" },
      { header: "PN RATING", label: "PN Rating -" },
    ],
  },
  {
    label: "Actuator / RM Code for Actuator",
    width: 260,
    children: [
      { header: "Actuator", label: "Actuator" },
      { header: "RM CODE FOR ACTUATOR", label: "RM Code for Actuator" },
    ],
  },
  {
    label: "LC / RTGS / Issuing bank name",
    width: 420,
    children: [
      { header: "LC/RTGS REF NO", label: " LC/RTGSRef No -" },
      { header: "LC DATE/RTGS DATE", label: "LC Date -" },
      {
        header: "LAST DATE OF SHIPMENT/DATE OF LC",
        label: "Ship Date Of LC -",
      },
      { header: "Issuing bank name", label: "Issuing Bank Name -" },
    ],
  },
];

export const GROUP_HEADER_TO_ACCESSOR: Record<string, string> = {
  "CONTRACT NO": "contractNo",
  "PO NO": "poNo",
  ITEM_NAME: "itemName",
  "PARTY ITEM NAME": "partyItemName",
  Item: "item",
  SIZE: "size",
  "PN RATING": "pnRating",
  Actuator: "actuator",
  "RM CODE FOR ACTUATOR": "rmCodeForActuator",
  "LC/RTGS REF NO": "lcRtgsRefNo",
  "LC DATE/RTGS DATE": "lcDateRtgsDate",
  "LAST DATE OF SHIPMENT/DATE OF LC": "lastDateOfShipmentDateOfLc",
  "Issuing bank name": "issuingBankName",
};