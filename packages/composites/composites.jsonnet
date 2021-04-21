local tsconfig = std.extVar('tsconfig');
local referenceIgnore = std.extVar('referenceIgnore');


local references = std.filter(
  function(reference) std.foldl(
    function(prev, ignore) prev && !std.endsWith(reference.path, ignore),
    referenceIgnore,
    true
  ),
  tsconfig.references
);

references
