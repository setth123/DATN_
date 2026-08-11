export const buildJobKeywordConditions = (keyword) => {
  if (!keyword) {
    return [];
  }
  const searchRegex = new RegExp(keyword, 'i');
  return [
    { title: searchRegex },
    { description: searchRegex },
    { level: searchRegex },
    { "requiredSkills.name": searchRegex } // MongoDB tự động quét qua mảng các object
  ];
};


export const buildSortQuery = (sort) => {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 }; // Sort by creation date ascending
    case "newest":
    default:
      return { createdAt: -1 };
  }
};
