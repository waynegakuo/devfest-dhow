export interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  route?: string;
  action?: string;
  display?: boolean;
}
