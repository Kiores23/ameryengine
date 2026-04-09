import { identityType } from "./identity";
import { skillsType } from "./skills";
import { projectType } from "./projects";
import { experienceType } from "./experiences";
import { otherType } from "./other";

export const NODES = [
  ...identityType,
  ...skillsType,
  ...projectType,
  ...experienceType,
  ...otherType
];