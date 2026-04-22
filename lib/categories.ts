/**
 * Centralized category management for the Sofixe ERP system
 * Provides consistent category definitions, colors, and helper functions
 * Used by both expenses and operations modules
 */

// Category definitions with IDs, names, and colors
export const CATEGORIES = {
  materials: {
    id: 'materials',
    name: 'Matériaux',
    description: 'Achats de matériaux de construction, fournitures, etc.',
    color: 'blue',
    icon: '🛠️'
  },
  labor: {
    id: 'labor',
    name: 'Main d\'œuvre',
    description: 'Salaires, honoraires, frais de personnel',
    color: 'green',
    icon: '👷'
  },
  equipment: {
    id: 'equipment',
    name: 'Équipement',
    description: 'Achat ou location d\'équipements',
    color: 'purple',
    icon: '⚙️'
  },
  transport: {
    id: 'transport',
    name: 'Transport',
    description: 'Frais de transport, carburant, logistique',
    color: 'orange',
    icon: '🚚'
  },
  utilities: {
    id: 'utilities',
    name: 'Services',
    description: 'Services publics, télécommunications, etc.',
    color: 'yellow',
    icon: '💡'
  },
  consulting: {
    id: 'consulting',
    name: 'Consulting',
    description: 'Frais de conseil, expertise, formation',
    color: 'pink',
    icon: '📊'
  },
  software: {
    id: 'software',
    name: 'Logiciels',
    description: 'Licences logicielles, abonnements SaaS',
    color: 'indigo',
    icon: '💻'
  },
  other: {
    id: 'other',
    name: 'Autre',
    description: 'Autres dépenses non catégorisées',
    color: 'gray',
    icon: '📦'
  }
} as const;

// Type definitions for type safety
export type CategoryId = keyof typeof CATEGORIES;
export type Category = typeof CATEGORIES[CategoryId];

// Category color mapping for UI components
export const CATEGORY_COLORS: Record<CategoryId, string> = {
  materials: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200',
  labor: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200',
  equipment: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200',
  transport: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200',
  utilities: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200',
  consulting: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-200',
  software: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200',
  other: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200'
};

// Helper functions
export function getCategory(id: string): Category | undefined {
  return CATEGORIES[id as CategoryId];
}

export function getCategoryName(id: string): string {
  return CATEGORIES[id as CategoryId]?.name || id;
}

export function getCategoryColor(id: string): string {
  return CATEGORY_COLORS[id as CategoryId] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200';
}

export function getCategoryIcon(id: string): string {
  return CATEGORIES[id as CategoryId]?.icon || '📦';
}

export function getCategoryDescription(id: string): string {
  return CATEGORIES[id as CategoryId]?.description || 'Catégorie non spécifiée';
}

export function getAllCategories(): Category[] {
  return Object.values(CATEGORIES);
}

export function getCategoryIds(): CategoryId[] {
  return Object.keys(CATEGORIES) as CategoryId[];
}

export function isValidCategoryId(id: string): id is CategoryId {
  return id in CATEGORIES;
}

// For React Select components
export const CATEGORY_OPTIONS = getAllCategories().map(category => ({
  value: category.id,
  label: category.name,
  description: category.description,
  color: category.color,
  icon: category.icon
}));

// Category groups for hierarchical organization
export const CATEGORY_GROUPS = {
  direct_costs: {
    name: 'Coûts directs',
    categories: ['materials', 'labor', 'equipment'] as CategoryId[],
    color: 'blue'
  },
  indirect_costs: {
    name: 'Coûts indirects',
    categories: ['transport', 'utilities', 'consulting', 'software'] as CategoryId[],
    color: 'green'
  },
  other_costs: {
    name: 'Autres coûts',
    categories: ['other'] as CategoryId[],
    color: 'gray'
  }
};

// Subcategory examples for each category (can be extended dynamically)
export const SUBCATEGORY_EXAMPLES: Record<CategoryId, string[]> = {
  materials: ['Bois', 'Ciment', 'Acier', 'Peinture', 'Électricité'],
  labor: ['Maçon', 'Électricien', 'Plombier', 'Architecte', 'Ingénieur'],
  equipment: ['Excavatrice', 'Bétonnière', 'Échafaudage', 'Outillage'],
  transport: ['Carburant', 'Location camion', 'Frais de route', 'Logistique'],
  utilities: ['Électricité', 'Eau', 'Internet', 'Téléphone'],
  consulting: ['Expertise technique', 'Conseil juridique', 'Formation'],
  software: ['Licence AutoCAD', 'Abonnement ERP', 'Outils de gestion'],
  other: ['Frais bancaires', 'Assurances', 'Divers']
};

// Utility function to format category for display
export function formatCategory(categoryId: string, includeIcon: boolean = false): string {
  const category = getCategory(categoryId);
  if (!category) return categoryId;
  
  return includeIcon ? `${category.icon} ${category.name}` : category.name;
}

// Function to get category badge class
export function getCategoryBadgeClass(categoryId: string): string {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  const colorClass = getCategoryColor(categoryId);
  return `${baseClasses} ${colorClass}`;
}