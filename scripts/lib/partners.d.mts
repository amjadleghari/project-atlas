export const ROOT_DIR: string;
export type PartnerVersion = {
  version: string;
  master: string;
  status: string;
  released?: string;
  sunset?: string;
  overlays: string[];
};
export type Partner = {
  id: string;
  name: string;
  summary?: string;
  status: string;
  owner?: string;
  contacts: { name: string; role?: string; email?: string }[];
  versions: PartnerVersion[];
};
export function listMasterVersions(siteDir: string): string[];
export function loadPartners(siteDir: string): { partners: Partner[]; problems: string[] };
