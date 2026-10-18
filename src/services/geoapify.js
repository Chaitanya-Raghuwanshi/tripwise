
const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY

export async function searchDestination(destination) {
  if (!API_KEY) {
    throw new Error('API key missing. Check your .env file.')
  }

  const geocodeUrl = new URL(
    'https://api.geoapify.com/v1/geocode/search',
  )

  geocodeUrl.searchParams.set('text', destination.trim())
  geocodeUrl.searchParams.set('limit', '1')
  geocodeUrl.searchParams.set('apiKey', API_KEY)

  const geocodeResponse = await fetch(geocodeUrl)

  if (!geocodeResponse.ok) {
    throw new Error('Could not search for this destination.')
  }

  const geocodeData = await geocodeResponse.json()
  const location = geocodeData.features?.[0]?.properties

  if (!location || location.lat == null || location.lon == null) {
    throw new Error('Destination not found. Try another city or place.')
  }

  const placesUrl = new URL('https://api.geoapify.com/v2/places')

  placesUrl.searchParams.set(
    'categories',
    [
      'tourism.attraction',
      'tourism.sights',
      'tourism',
      'leisure.park',
      'leisure',
      'natural',
      'entertainment',
    ].join(','),
  )

  placesUrl.searchParams.set(
    'filter',
    `circle:${location.lon},${location.lat},15000`,
  )
  placesUrl.searchParams.set('bias', `proximity:${location.lon},${location.lat}`)
  placesUrl.searchParams.set('limit', '50')
  placesUrl.searchParams.set('apiKey', API_KEY)

  const placesResponse = await fetch(placesUrl)

  if (!placesResponse.ok) {
    throw new Error('Could not load places. Please try again.')
  }

  const placesData = await placesResponse.json()
  const uniquePlaces = new Map()

  for (const feature of placesData.features || []) {
    const properties = feature.properties || {}
    const name = properties.name?.trim()
    const lat = properties.lat
    const lon = properties.lon
    const categories = properties.categories || []

    // Skip unnamed features and results without usable coordinates.
    if (!name || lat == null || lon == null) continue

    const id =
      properties.place_id ||
      `${name.toLowerCase()}-${lat}-${lon}`

    if (uniquePlaces.has(id)) continue

    // Rank stronger tourist attractions ahead of broad leisure/nature results.
    const categoryText = categories.join(' ').toLowerCase()
    let score = 0

    if (categoryText.includes('tourism.attraction')) score += 5
    if (categoryText.includes('tourism.sights')) score += 4
    if (categoryText.includes('tourism')) score += 2
    if (categoryText.includes('leisure.park')) score += 2
    if (categoryText.includes('natural')) score += 1
    if (properties.formatted) score += 1

    uniquePlaces.set(id, {
      id,
      name,
      address: properties.formatted || 'Address unavailable',
      categories,
      lat,
      lon,
      score,
    })
  }

  return [...uniquePlaces.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 20)
    .map(({ score, ...place }) => place)
}
