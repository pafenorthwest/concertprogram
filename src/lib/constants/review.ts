export const pieceCategories = ['Concerto', 'Solo', 'Ensemble', 'Not Appropriate'] as const;
export type PieceCategory = (typeof pieceCategories)[number];

export const divisionTags = [
	'High-Strings',
	'Low-Strings',
	'Piano',
	'Woodwinds',
	'Ensembles'
] as const;
export type DivisionTag = (typeof divisionTags)[number];

export const reviewStatuses = ['Complete'] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];
