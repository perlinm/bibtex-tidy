export const MONTH_MACROS = [
	"jan",
	"feb",
	"mar",
	"apr",
	"may",
	"jun",
	"jul",
	"aug",
	"sep",
	"oct",
	"nov",
	"dec",
] as const;

export const MONTH_SET = new Set<string>(MONTH_MACROS);

export const MONTH_CONVERSIONS: Record<string, (typeof MONTH_MACROS)[number]> =
	{
		"1": "jan",
		"2": "feb",
		"3": "mar",
		"4": "apr",
		"5": "may",
		"6": "jun",
		"7": "jul",
		"8": "aug",
		"9": "sep",
		"10": "oct",
		"11": "nov",
		"12": "dec",
		jan: "jan",
		feb: "feb",
		mar: "mar",
		apr: "apr",
		may: "may",
		jun: "jun",
		jul: "jul",
		aug: "aug",
		sep: "sep",
		oct: "oct",
		nov: "nov",
		dec: "dec",
		january: "jan",
		february: "feb",
		march: "mar",
		april: "apr",
		june: "jun",
		july: "jul",
		august: "aug",
		september: "sep",
		october: "oct",
		november: "nov",
		december: "dec",
	};
