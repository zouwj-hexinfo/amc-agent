export type AuthUserConfig = {
  username: string;
  password: string;
  displayName: string;
  email: string;
  role: string;
  avatar: string;
};

export const authUsers: AuthUserConfig[] = [
  {
    username: 'admin',
    password: 'admin123456',
    displayName: 'Admin',
    email: 'admin@amc.local',
    role: '系统管理员',
    avatar: 'AD',
  },
];
