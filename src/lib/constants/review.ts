export const pieceCategories = ['Concerto', 'Solo', 'Ensemble', 'Not Appropriate'] as const;
export type PieceCategory = (typeof pieceCategories)[number];

export const divisionTags = ['Violin Viola', 'Cello Bass', 'Piano', 'Woodwinds'] as const;
export type DivisionTag = (typeof divisionTags)[number];

export const reviewStatuses = ['Complete'] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];
