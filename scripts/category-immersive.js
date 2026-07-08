import decorateCategory from '../category/category.js';

export default function decorate(block) {
  // Add the class signature explicitly so the shared engine matches the route
  block.classList.add('category-immersive');
  decorateCategory(block);
}