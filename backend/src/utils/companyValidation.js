const validateCompanyData = (data) => {
  const errors = [];

  if (!data.name) errors.push("Company name is required");
  if (!data.email || !data.email.includes("@"))
    errors.push("Invalid company email");

  if (!data.TIN || data.TIN.length < 10)
    errors.push("Invalid TIN");

  if (
    data.foundedYear &&
    data.foundedYear > new Date().getFullYear()
  ) {
    errors.push("Founded year is not valid");
  }

  if (!data.companyType)
    errors.push("Company type is required");

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default validateCompanyData;