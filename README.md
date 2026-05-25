# The Braj Madhuri

A Vite + React storefront for The Braj Madhuri devotional products catalog.

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates a production build in `dist/`.
- `npm run lint` runs ESLint across the project.
- `npm run preview` serves the production build locally.

## Project Structure

- `src/App.jsx` composes the landing page sections and shared cart state.
- `src/components/` contains the UI sections such as the header, category grid, galleries, and footer.
- `src/data/productData.js` holds product titles, descriptions, and pricing metadata.
- `src/assets/images/` stores the gallery images grouped by product category.
- `public/` contains static files served as-is, including `favicon.svg`.

## Notes

- The category galleries are generated automatically from the folder names inside `src/assets/images/`.
- Product copy and prices can be updated in `src/data/productData.js`.
