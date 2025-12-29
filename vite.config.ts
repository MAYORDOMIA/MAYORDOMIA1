
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno del directorio actual.
  // El tercer argumento '' permite cargar variables que no tienen el prefijo VITE_.
  // Se utiliza '.' para referirse al directorio de trabajo actual y evitar errores de tipado con process.cwd().
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Inyecta la variable de entorno para que esté disponible como process.env.API_KEY en el navegador
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      port: 3000
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
