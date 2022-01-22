// This is to limit the value supplied for the sort (prevent SQL injection)...EK
const __SORTS = {
  asc: 'asc',
  desc: 'desc',
}

const createSortClauseFromModel = sort => {
  return sort.map(s => `${wambiDB.escapeIdentifier(s.colId)} ${__SORTS[s.sort] || 'asc'}`).join(', ')
}

const createWhereFromFilter = filter => {
  return Object.keys(filter)
    .map(k => _getWhereForField(k, filter[k], filter.trustIdentifiers))
    .join(' AND ')
}

const _getWhereForField = (field, filterField, trustIdentifiers) => {
  if (filterField.operator != null) {
    // Multiple filter on this field
    const firstCondition = _getFilterSQL(field, filterField.condition1, trustIdentifiers)
    const secondCondition = _getFilterSQL(field, filterField.condition2, trustIdentifiers)
    return `(${firstCondition} ${filterField.operator} ${secondCondition})`
  } else {
    // Single filter...EK
    return _getFilterSQL(field, filterField, trustIdentifiers)
  }
}

const _getFilterSQL = (field, filterCondition, trustIdentifiers) => {
  const { dateFrom: dateFilterRaw, dateTo, filterType: dataType, type: opType, filter: filterRaw, filterTo } = filterCondition

  // Ensure the field identifier and the filter value are safe to execute...EK
  if (!trustIdentifiers) {
    field = wambiDB.escapeIdentifier(field)
  }

  const filter = wambiDB.escapeValue(filterRaw)
  const dateFilter = wambiDB.escapeValue(dateFilterRaw)

  if (dataType === 'text') {
    switch (opType) {
      case 'equals':
        return `${field} = ${filter}`
      case 'notEqual':
        return `${field} != ${filter}`
      case 'contains':
        return `${field} LIKE ${wambiDB.escapeValue('%' + filterRaw + '%')}`
      case 'notContains':
        return `${field} NOT LIKE ${wambiDB.escapeValue('%' + filterRaw + '%')}`
      case 'startsWith':
        return `${field} LIKE ${wambiDB.escapeValue(filterRaw + '%')}`
      case 'endsWith':
        return `${field} LIKE ${wambiDB.escapeValue('%' + filterRaw)}`
      default:
        console.log(`NOT IMPLEMENTED FILTER OPERATOR TYPE: ${opType}`)
        return 'true'
    }
  } else if (dataType === 'number') {
    switch (opType) {
      case 'equals':
        return `${field} = ${filter}`
      case 'notEqual':
        return `${field} != ${filter}`
      case 'greaterThan':
        return `${field} > ${filter}`
      case 'greaterThanOrEqual':
        return `${field} >= ${filter}`
      case 'lessThan':
        return `${field} < ${filter}`
      case 'lessThanOrEqual':
        return `${field} <= ${filter}`
      case 'inRange':
        return `(${field} >= ${filter} AND ${field} <= ${filterTo})`
      default:
        console.log(`NOT IMPLEMENTED FILTER OPERATOR TYPE: ${opType}`)
        return 'true'
    }
  } else if (dataType === 'date') {
    // Remove the 00:00:00 time to be able to do a LIKE clause for anytime within a day...JC
    const [dateLikeFilter] = dateFilter.slice(1).split(' ')
    switch (opType) {
      case 'equals':
        return `${field} LIKE '%${dateLikeFilter}%'`
      case 'greaterThan':
        return `${field} > ${dateFilter} + INTERVAL 1 DAY`
      case 'lessThan':
        return `${field} < ${dateFilter}`
      case 'notEqual':
        return `${field} NOT LIKE '%${dateLikeFilter}%'`
      case 'inRange':
        return `(${field} >= ${dateFilter} AND ${field} <= '${dateTo}' + INTERVAL 1 DAY)`
      default:
        console.log(`NOT IMPLEMENTED FILTER OPERATOR TYPE: ${opType}`)
        return 'true'
    }
  } else {
    console.log(`NOT IMPLEMENTED FILTER DATA TYPE: ${dataType}`)
    return 'true'
  }
}

module.exports = {
  createSortClauseFromModel,
  createWhereFromFilter,
}
