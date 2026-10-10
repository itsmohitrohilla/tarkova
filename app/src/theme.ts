// iOS system colours, light and dark. Text only ever wears ink/ink2/ink3; colour belongs to marks and badges.
import { useColorScheme } from 'react-native'

const light = {
  dark: false,
  bg: '#f2f2f7', card: '#ffffff', ink: '#000000', ink2: '#636366', ink3: '#8e8e93',
  line: '#d1d1d6', fill: 'rgba(118,118,128,0.14)', thumb: '#ffffff',
  up: '#248a3d', down: '#d70015', star: '#ffb300',
}
const dark: Theme = {
  dark: true,
  bg: '#000000', card: '#1c1c1e', ink: '#ffffff', ink2: '#aeaeb2', ink3: '#8e8e93',
  line: '#38383a', fill: 'rgba(118,118,128,0.28)', thumb: '#636366',
  up: '#30d158', down: '#ff453a', star: '#ffc21a',
}
export type Theme = typeof light
export const useTheme = (): Theme => (useColorScheme() === 'dark' ? dark : light)
