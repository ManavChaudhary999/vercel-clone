export interface Project {
    id: string;
    name: string;
    gitURL: string;
    subDomain: string;
    customDomain: string;
}
  
export interface Deployment {
    id: string;
    projectId: string;
    status: string;
}