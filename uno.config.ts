import { defineConfig } from 'unocss'
import presetWind from '@unocss/preset-wind'

export default defineConfig({
  presets: [presetWind()],
  cli: {
    entry: {
      patterns: ['MAR/**/*.html'],
      outFile: 'MAR/css/uno.css',
    },
  },
})


