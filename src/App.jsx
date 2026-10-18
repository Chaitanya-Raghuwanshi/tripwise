
import { useEffect, useMemo, useState } from 'react'
import {
  Compass,
  MapPin,
  Search,
  Sparkles,
  Mountain,
  Building2,
  Waves,
  Trees,
  ArrowRight,
  X,
  Trash2,
  MapPinned,
  Heart,
  Navigation,
  Camera,
  Plus,
  Check,
  LoaderCircle,
  Globe2,
  Route,
} from 'lucide-react'
import { searchDestination } from './services/geoapify'

const STORAGE_KEY = 'tripwise-itinerary'

const categories = [
  { label: 'All places', value: 'all', icon: Compass },
  { label: 'Nature', value: 'nature', icon: Trees },
  { label: 'Beaches', value: 'beach', icon: Waves },
  { label: 'Landmarks', value: 'landmark', icon: Building2 },
  { label: 'Adventure', value: 'adventure', icon: Mountain },
]

const photoCollections = {
  nature: [
    'photo-1448375240586-882707db888b',
    'photo-1472396961693-142e6e269027',
    'photo-1470770841072-f978cf4d019e',
  ],
  beach: [
    'photo-1507525428034-b723cf961d3e',
    'photo-1519046904884-53103b34b206',
    'photo-1500375592092-40eb2168fd21',
  ],
  landmark: [
    'photo-1519501025264-65ba15a82390',
    'photo-1511818966892-d7d671e672a2',
    'photo-1518005020951-eccb494ad742',
  ],
  adventure: [
    'photo-1464822759023-fed622ff2c3b',
    'photo-1464278533981-50106e6176b1',
    'photo-1454496522488-7a8e488e8606',
  ],
  general: [
    'photo-1488646953014-85cb44e25828',
    'photo-1476514525535-07fb3b4ae5f1',
    'photo-1501785888041-af3ef285b470',
  ],
}

function readSavedTrip() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function matchesCategory(place, category) {
  if (category === 'all') return true

  const placeCategories = (place.categories || []).join(' ').toLowerCase()

  if (category === 'nature') {
    return /natural|park|garden|forest|lake|water|national_park/.test(
      placeCategories,
    )
  }

  if (category === 'beach') {
    return /beach|surf|water|coast|bay|island/.test(placeCategories)
  }

  if (category === 'landmark') {
    return /tourism|historic|architecture|museum|monument|attraction|cultural/.test(
      placeCategories,
    )
  }

  if (category === 'adventure') {
    return /sport|climbing|hiking|adventure|ski|camping|amusement/.test(
      placeCategories,
    )
  }

  return true
}

function getPlaceType(place) {
  const value = (place.categories || []).join(' ').toLowerCase()

  if (/beach|surf|coast|bay/.test(value)) return 'beach'
  if (/natural|park|garden|forest|lake|water/.test(value)) return 'nature'
  if (/sport|climbing|hiking|ski|camping/.test(value)) return 'adventure'
  if (/tourism|historic|museum|monument|architecture|cultural/.test(value)) {
    return 'landmark'
  }

  return 'general'
}


function getPhotoUrl(place) {
  const type = getPlaceType(place)
  const collection = photoCollections[type] || photoCollections.general
  const identity = `${place.id || ''}-${place.name || ''}`

  let hash = 0
  for (let i = 0; i < identity.length; i += 1) {
    hash = (hash * 31 + identity.charCodeAt(i)) >>> 0
  }

  const photoId = collection[hash % collection.length]
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1000&q=85`
}

function formatCategory(place) {
  const type = getPlaceType(place)

  const labels = {
    nature: 'Nature & outdoors',
    beach: 'Coastal escape',
    landmark: 'Landmark',
    adventure: 'Adventure',
    general: 'Local discovery',
  }

  return labels[type]
}

function getMapUrl(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${place.lat},${place.lon}`,
  )}`
}

function PlacePhoto({ place, large = false }) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div
      className={`group/photo relative isolate overflow-hidden bg-[#1b281d] ${
        large ? 'h-64 sm:h-80' : 'h-52'
      }`}
    >
      {!imageFailed && (
        <img
          src={getPhotoUrl(place)}
          alt={`Travel scenery for ${place.name}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover/photo:scale-105"
        />
      )}

      {imageFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#152019] via-[#1b281d] to-[#293b2c]">
          <Camera size={38} className="text-[#c3df91]" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#14291f]/65 via-transparent to-black/10" />

      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/40 bg-[#111914]/92 px-3 py-1.5 text-xs font-semibold text-[#c3df91] shadow-sm backdrop-blur">
        <Sparkles size={13} />
        {formatCategory(place)}
      </span>

      <span className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs font-medium text-white/90">
        <Camera size={14} />
        Travel inspiration
      </span>
    </div>
  )
}

function App() {
  const [destination, setDestination] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState('az')
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [itinerary, setItinerary] = useState(readSavedTrip)
  const [showItinerary, setShowItinerary] = useState(false)
  const [itineraryMessage, setItineraryMessage] = useState('')
  const [searchLocation, setSearchLocation] = useState('')
  const [selectedPlace, setSelectedPlace] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itinerary))
    } catch {
      setItineraryMessage('Your browser could not save this itinerary.')
    }
  }, [itinerary])

  const filteredPlaces = useMemo(() => {
    return places
      .filter((place) => matchesCategory(place, activeCategory))
      .sort((a, b) => {
        const result = (a.name || '').localeCompare(
          b.name || '',
          undefined,
          { sensitivity: 'base' },
        )

        return sortOrder === 'az' ? result : -result
      })
  }, [places, activeCategory, sortOrder])

  async function handleSearch(event) {
    event?.preventDefault()

    const query = destination.trim()

    if (!query) {
      setError('Enter a city or destination to start exploring.')
      return
    }

    setLoading(true)
    setError('')
    setActiveCategory('all')
    setShowItinerary(false)

    try {
      const results = await searchDestination(query)
      setPlaces(results)
      setSearchLocation(query)

      if (results.length === 0) {
        setError('No attractions were found nearby. Try another destination.')
      }
    } catch (searchError) {
      setError(
        searchError?.message ||
          'Something went wrong while searching. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  function addToItinerary(place) {
    const alreadyAdded = itinerary.some((item) => item.id === place.id)

    if (alreadyAdded) {
      setItineraryMessage('This place is already in your itinerary.')
      return
    }

    setItinerary((current) => [...current, place])
    setItineraryMessage(`${place.name} added to your trip.`)
  }

  function removeFromItinerary(placeId) {
    setItinerary((current) => current.filter((place) => place.id !== placeId))
    setItineraryMessage('Place removed from your itinerary.')
  }

  function chooseDestination(city) {
    setDestination(city)
    setError('')
    setShowItinerary(false)
    document.getElementById('destination-search')?.focus()
  }

  function openItinerary() {
    setShowItinerary(true)
    setItineraryMessage('')
    document.getElementById('explore')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function showExplore() {
    setShowItinerary(false)
    document.getElementById('explore')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const isAdded = (placeId) =>
    itinerary.some((place) => place.id === placeId)

  return (
    <div className="min-h-screen bg-[#0b100d] text-[#e9e4d7]">
      <header className="sticky top-0 z-40 border-b border-[#29342b] bg-[#0b100d]/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3"
            aria-label="Trip Wise home"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c3df91] text-[#10160f] shadow-sm">
              <Compass size={23} strokeWidth={1.8} />
            </span>
            <span className="text-left">
              <span className="block font-['Manrope'] text-xl font-extrabold tracking-tight">
                trip<span className="text-[#c3df91]">wise</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.19em] text-[#9aa79a]">
                YOUR NEXT GOOD STORY
              </span>
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-5">
            <button
              onClick={showExplore}
              className="hidden text-sm font-semibold text-[#b4c0b0] transition hover:text-[#c3df91] sm:block"
            >
              Explore
            </button>

            <button
              onClick={openItinerary}
              className="flex items-center gap-2 rounded-full bg-[#c3df91] px-4 py-2.5 text-sm font-semibold text-[#10160f] transition hover:bg-[#a7c477] sm:px-5"
            >
              <Heart size={16} />
              <span>My Trip</span>
              {itinerary.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1d291d] px-1 text-xs font-bold text-[#c3df91]">
                  {itinerary.length}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-28 -top-24 h-96 w-96 rounded-full bg-[#1b281d] opacity-70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[#172019] blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#354334] bg-[#111914]/80 px-4 py-2 text-sm font-medium text-[#c3df91] shadow-sm">
                <Sparkles size={15} />
                A LITTLE CLOSER TO SOMEWHERE NEW
              </div>

              <h1 className="max-w-2xl text-5xl font-extrabold leading-[1.08] tracking-[-0.055em] sm:text-6xl lg:text-[76px]">
                Find your next
                <br />
                <span className="text-[#c3df91]">happy place.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-[#9aa79a] sm:text-lg">
                Thoughtfully find places worth the journey, save the spots you love,
                and build a trip that feels entirely yours.
              </p>

              <form
                onSubmit={handleSearch}
                className="mt-9 flex flex-col gap-3 rounded-[24px] border border-[#29342b] bg-[#111914] p-3 shadow-[0_16px_50px_rgba(32,75,61,0.08)] sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1d291d] text-[#c3df91]">
                    <MapPin size={19} />
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <label
                      htmlFor="destination-search"
                      className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#9aa79a]"
                    >
                      Where to?
                    </label>
                    <input
                      id="destination-search"
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                      placeholder="Try Chennai, Goa, Manali..."
                      className="w-full border-0 bg-transparent text-sm font-medium text-[#e9e4d7] outline-none placeholder:font-normal placeholder:text-[#a0aaa0] focus:ring-0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-[17px] bg-[#c3df91] px-7 font-semibold text-[#10160f] transition hover:bg-[#a7c477] disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle size={19} className="animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                  {loading ? 'Exploring...' : 'Explore places'}
                </button>
              </form>

              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-900/70 bg-[#241715] px-4 py-3 text-sm text-red-200"
                >
                  <span>{error}</span>
                  {!loading && destination.trim() && (
                    <button
                      onClick={handleSearch}
                      className="shrink-0 font-bold underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
                <span className="mr-1 text-[#9aa79a]">Popular:</span>
                {['Chennai', 'Goa', 'Jaipur', 'Manali'].map((city) => (
                  <button
                    key={city}
                    onClick={() => chooseDestination(city)}
                    className="rounded-full border border-[#29342b] bg-[#111914]/80 px-3.5 py-2 text-[#b4c0b0] transition hover:border-[#c3df91] hover:bg-[#1d291d] hover:text-[#c3df91]"
                  >
                    {city}
                  </button>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-sm text-[#9aa79a]">
                <span className="flex items-center gap-2">
                  <Check size={16} className="text-[#c3df91]" />
                  Discover nearby places
                </span>
                <span className="flex items-center gap-2">
                  <Check size={16} className="text-[#c3df91]" />
                  Save your favourites
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:ml-auto">
              <div className="absolute -left-4 top-16 z-10 hidden rounded-2xl border border-[#29342b] bg-[#111914] p-4 shadow-xl sm:block">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d291d] text-[#c3df91]">
                    <MapPinned size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-bold">Your kind of trip</p>
                    <p className="mt-0.5 text-xs text-[#9aa79a]">
                      Built around you
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[34px] bg-[#1b281d] p-4 shadow-[0_25px_65px_rgba(32,75,61,0.14)] sm:p-5">
                <div className="relative flex min-h-[350px] items-center justify-center overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1b281d] via-[#243024] to-[#293b2c] sm:min-h-[410px]">
                  <div className="absolute -left-16 top-4 h-64 w-64 rounded-full border-[35px] border-white/20" />
                  <div className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full border-[55px] border-[#c3df91]/15" />

                  <svg
                    viewBox="0 0 400 360"
                    className="relative w-full max-w-[400px]"
                    role="img"
                    aria-label="Illustration of a winding travel route through hills"
                  >
                    <path
                      d="M0 265 Q65 190 130 245 T260 215 T400 190 V360 H0Z"
                      fill="#3b553c"
                    />
                    <path
                      d="M0 310 Q90 230 165 280 T315 245 T400 265 V360 H0Z"
                      fill="#2d432f"
                    />
                    <path
                      d="M0 340 Q90 285 170 320 T330 290 T400 310 V360 H0Z"
                      fill="#1d3322"
                    />
                    <path
                      d="M65 300 C80 245 170 280 180 220 S260 195 270 150 S320 135 330 80"
                      fill="none"
                      stroke="#fffdf5"
                      strokeWidth="5"
                      strokeDasharray="7 9"
                      strokeLinecap="round"
                    />
                    <circle cx="65" cy="300" r="12" fill="#fffdf5" />
                    <circle cx="65" cy="300" r="5" fill="#c3df91" />
                    <circle cx="330" cy="80" r="19" fill="#c3df91" />
                    <path
                      d="M330 68 C322 68 316 74 316 82 C316 92 330 103 330 103 S344 92 344 82 C344 74 338 68 330 68Z"
                      fill="#fffdf5"
                    />
                    <circle cx="330" cy="81" r="4" fill="#c3df91" />
                    <path
                      d="M72 175 L108 116 L140 175Z"
                      fill="#dce7c5"
                      opacity=".8"
                    />
                    <path
                      d="M104 175 L153 92 L203 175Z"
                      fill="#9aaf83"
                    />
                    <path
                      d="M135 122 L153 92 L171 122 L157 117 L153 125 L148 117Z"
                      fill="#c3df91"
                    />
                    <circle cx="300" cy="55" r="23" fill="#c3df91" opacity=".9" />
                  </svg>

                  <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-[#39483a] bg-[#111914]/92 p-4 shadow-lg backdrop-blur-md">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#9aa79a]">
                        The journey is yours
                      </p>
                      <p className="mt-1 font-['Manrope'] text-lg font-extrabold">
                        Make room for wonder.
                      </p>
                    </div>
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c3df91] text-[#10160f]">
                      <Navigation size={20} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 right-6 hidden rounded-2xl border border-[#29342b] bg-[#111914] px-4 py-3 shadow-lg sm:block">
                <div className="flex items-center gap-2">
                  <Globe2 size={17} className="text-[#c3df91]" />
                  <span className="text-sm font-bold">Your next story awaits</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="explore"
          className="scroll-mt-24 border-t border-[#29342b] bg-[#111914]/55"
        >
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
            {showItinerary ? (
              <>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#c3df91]">
                      <Heart size={16} />
                      Your personal collection
                    </div>
                    <h2 className="text-3xl font-extrabold sm:text-4xl">
                      My itinerary<span className="text-[#c3df91]">.</span>
                    </h2>
                    <p className="mt-3 max-w-xl leading-7 text-[#9aa79a]">
                      Every place you save, all in one spot. Your list stays
                      saved on this browser when you come back.
                    </p>
                  </div>
                  <button
                    onClick={showExplore}
                    className="inline-flex items-center gap-2 self-start rounded-full border border-[#354334] bg-[#111914] px-5 py-3 text-sm font-bold text-[#c3df91] transition hover:bg-[#1d291d] sm:self-auto"
                  >
                    <Compass size={17} />
                    Discover more
                  </button>
                </div>

                {itineraryMessage && (
                  <p
                    role="status"
                    className="mt-5 rounded-xl bg-[#1d291d] px-4 py-3 text-sm text-[#c3df91]"
                  >
                    {itineraryMessage}
                  </p>
                )}

                {itinerary.length === 0 ? (
                  <div className="mt-10 rounded-3xl border border-dashed border-[#39483a] bg-[#111914] px-6 py-16 text-center">
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1d291d] text-[#c3df91]">
                      <Route size={28} />
                    </span>
                    <h3 className="mt-5 text-xl font-extrabold">
                      Your trip starts with one place
                    </h3>
                    <p className="mx-auto mt-2 max-w-md leading-7 text-[#9aa79a]">
                      Search a destination and save the spots you want to
                      explore. They will show up here.
                    </p>
                    <button
                      onClick={showExplore}
                      className="mt-6 rounded-full bg-[#c3df91] px-6 py-3 text-sm font-bold text-[#10160f] transition hover:bg-[#a7c477]"
                    >
                      Find places
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-8 flex items-center gap-2 text-sm text-[#9aa79a]">
                      <MapPinned size={17} />
                      {itinerary.length} saved{' '}
                      {itinerary.length === 1 ? 'place' : 'places'}
                    </div>
                    <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {itinerary.map((place) => (
                        <article
                          key={place.id}
                          className="overflow-hidden rounded-[24px] border border-[#29342b] bg-[#111914] shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                        >
                          <PlacePhoto place={place} />
                          <div className="p-5">
                            <h3 className="text-lg font-extrabold leading-snug">
                              {place.name}
                            </h3>
                            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[#9aa79a]">
                              <MapPin
                                size={16}
                                className="mt-1 shrink-0 text-[#c3df91]"
                              />
                              <span>{place.address}</span>
                            </p>
                            <div className="mt-5 flex gap-2">
                              <a
                                href={getMapUrl(place)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c3df91] px-3 py-3 text-sm font-bold text-[#10160f] transition hover:bg-[#a7c477]"
                              >
                                <Navigation size={15} />
                                Open map
                              </a>
                              <button
                                onClick={() => removeFromItinerary(place.id)}
                                aria-label={`Remove ${place.name} from itinerary`}
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#29342b] text-[#9aa79a] transition hover:border-red-900 hover:bg-[#241715] hover:text-red-300"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[#c3df91]">
                      <Compass size={16} />
                      YOUR NEXT GOOD STORY
                    </div>
                    <h2 className="text-3xl font-extrabold sm:text-4xl">
                      {searchLocation
                        ? `Explore ${searchLocation}`
                        : 'Places worth the journey'}
                      <span className="text-[#c3df91]">.</span>
                    </h2>
                    <p className="mt-3 max-w-xl leading-7 text-[#9aa79a]">
                      {places.length > 0
                        ? 'Find your favourites, browse by interest, and save the places you want to visit.'
                        : 'From hidden green escapes to iconic landmarks, your next favourite place is out there.'}
                    </p>
                  </div>
                  {places.length > 0 && (
                    <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#1d291d] px-4 py-2 text-sm font-semibold text-[#c3df91] sm:self-auto">
                      <MapPin size={15} />
                      {filteredPlaces.length} places found
                    </span>
                  )}
                </div>

                <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
                  {categories.map(({ label, value, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setActiveCategory(value)}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                        activeCategory === value
                          ? 'border-[#c3df91] bg-[#c3df91] text-[#10160f] shadow-sm'
                          : 'border-[#29342b] bg-[#111914] text-[#b4c0b0] hover:border-[#c3df91] hover:bg-[#1d291d]'
                      }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>

                {places.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                    <label
                      htmlFor="sort-places"
                      className="text-sm font-semibold text-[#b4c0b0]"
                    >
                      Sort by
                    </label>
                    <select
                      id="sort-places"
                      value={sortOrder}
                      onChange={(event) => setSortOrder(event.target.value)}
                      className="rounded-xl border border-[#29342b] bg-[#111914] px-4 py-2.5 text-sm font-semibold text-[#c3df91] outline-none focus:border-[#c3df91]"
                    >
                      <option value="az">Name A–Z</option>
                      <option value="za">Name Z–A</option>
                    </select>
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <LoaderCircle
                      size={34}
                      className="animate-spin text-[#c3df91]"
                    />
                    <h3 className="mt-5 text-lg font-extrabold">
                      Finding your next adventure...
                    </h3>
                    <p className="mt-2 text-sm text-[#9aa79a]">
                      Looking for interesting places nearby.
                    </p>
                  </div>
                ) : places.length === 0 ? (
                  <div className="mt-8 grid gap-5 sm:grid-cols-3">
                    {[
                      {
                        name: 'Find natural escapes',
                        description:
                          'Discover gardens, parks, lakes, and outdoor spaces.',
                        type: 'nature',
                        image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85',
                      },
                      {
                        name: 'Explore the coast',
                        description:
                          'Look for beaches, waterfronts, and scenic views.',
                        type: 'beach',
                        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
                      },
                      {
                        name: 'See iconic places',
                        description:
                          'Find cultural attractions and interesting landmarks.',
                        type: 'landmark',
                        image: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=85',
                      },
                    ].map(({ name, description, type, image }) => (
                      <button
                        key={type}
                        onClick={() => {
                          setActiveCategory(type)
                          document
                            .getElementById('destination-search')
                            ?.focus()
                        }}
                        className="group relative min-h-[250px] overflow-hidden rounded-3xl border border-[#29342b] bg-[#111914] p-6 text-left transition hover:border-[#3b4a38]"
                      >
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-105 group-hover:opacity-75"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#07100a] via-[#07100a]/45 to-[#07100a]/5" />
                        <div className="relative flex min-h-[200px] flex-col justify-end">
                          <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0b100d]/60 text-[#c3df91]">
                            {type === 'nature' ? <Trees size={20} /> : type === 'beach' ? <Waves size={20} /> : <Building2 size={20} />}
                          </span>
                          <h3 className="text-lg font-extrabold text-[#f2efe5]">{name}</h3>
                          <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                            {description}
                          </p>
                          <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#c3df91]">
                            Start exploring <ArrowRight size={16} />
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : filteredPlaces.length === 0 ? (
                  <div className="mt-8 rounded-3xl border border-dashed border-[#39483a] bg-[#111914] px-6 py-14 text-center">
                    <Search
                      size={30}
                      className="mx-auto text-[#c3df91]"
                    />
                    <h3 className="mt-4 text-lg font-extrabold">
                      No places in this category yet
                    </h3>
                    <p className="mt-2 text-sm text-[#9aa79a]">
                      Try another filter to see more places.
                    </p>
                    <button
                      onClick={() => setActiveCategory('all')}
                      className="mt-5 rounded-full bg-[#c3df91] px-5 py-2.5 text-sm font-bold text-[#10160f]"
                    >
                      Show all places
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPlaces.map((place) => (
                      <article
                        key={place.id}
                        className="group overflow-hidden rounded-[24px] border border-[#29342b] bg-[#111914] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <PlacePhoto place={place} />
                        <div className="p-5">
                          <h3 className="text-lg font-extrabold leading-snug transition group-hover:text-[#c3df91]">
                            {place.name}
                          </h3>

                          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[#9aa79a]">
                            <MapPin
                              size={16}
                              className="mt-1 shrink-0 text-[#c3df91]"
                            />
                            <span className="line-clamp-2">{place.address}</span>
                          </p>

                          <div className="mt-5 flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedPlace(place)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#29342b] px-3 py-3 text-sm font-bold text-[#e9e4d7] transition hover:bg-[#1d291d]"
                            >
                              <MapPinned size={15} />
                              Details
                            </button>
                            <a
                              href={getMapUrl(place)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#29342b] px-3 py-3 text-sm font-bold text-[#c3df91] transition hover:bg-[#1d291d]"
                            >
                              <Navigation size={15} />
                              Map
                            </a>
                            <button
                              onClick={() => addToItinerary(place)}
                              disabled={isAdded(place.id)}
                              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${
                                isAdded(place.id)
                                  ? 'bg-[#1d291d] text-[#c3df91]'
                                  : 'bg-[#c3df91] text-[#10160f] hover:bg-[#a7c477]'
                              }`}
                            >
                              {isAdded(place.id) ? (
                                <>
                                  <Check size={16} />
                                  Added
                                </>
                              ) : (
                                <>
                                  <Plus size={16} />
                                  Add to trip
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="overflow-hidden rounded-[32px] border border-[#29342b] bg-[#111914] px-6 py-12 text-[#e9e4d7] sm:px-12 sm:py-14">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#354334] bg-[#1d291d] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#c3df91]">
                  <Sparkles size={14} />
                  Your journey, your way
                </span>
                <h2 className="mt-5 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
                  Good trips begin with a little curiosity.
                </h2>
                <p className="mt-4 max-w-xl leading-7 text-white/70">
                  Search a place, save what catches your eye, and turn a list
                  of possibilities into your next adventure.
                </p>
              </div>
              <button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                  document.getElementById('destination-search')?.focus({
                    preventScroll: true,
                  })
                }}
                className="inline-flex items-center justify-center gap-2 justify-self-start rounded-full bg-[#c3df91] px-6 py-3.5 text-sm font-extrabold text-[#10160f] transition hover:bg-[#a7c477] md:justify-self-end"
              >
                Find your next trip <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#29342b] bg-[#111914]/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-[#9aa79a] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 self-start font-['Manrope'] text-base font-extrabold text-[#c3df91]"
          >
            <Compass size={19} />
            tripwise
          </button>
          <p>Made for curious minds and roads yet to be travelled.</p>
          <p className="font-medium">Explore more. Worry less.</p>
        </div>
      </footer>

      {itineraryMessage && !showItinerary && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#c3df91] px-5 py-3.5 text-sm font-medium text-[#10160f] shadow-xl"
        >
          <Check size={17} className="shrink-0 text-[#1d291d]" />
          <span>{itineraryMessage}</span>
          <button
            onClick={() => setItineraryMessage('')}
            aria-label="Dismiss notification"
            className="ml-1 rounded-lg p-1 text-[#10160f]/60 hover:bg-[#111914]/10 hover:text-[#10160f]"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {selectedPlace && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="place-details-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPlace(null)
          }}
        >
          <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-[#354334] bg-[#111914] shadow-2xl">
            <button
              onClick={() => setSelectedPlace(null)}
              aria-label="Close destination details"
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0b100d]/85 text-white transition hover:bg-[#29342b]"
            >
              <X size={19} />
            </button>
            <PlacePhoto place={selectedPlace} large />
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c3df91]">
                {formatCategory(selectedPlace)}
              </p>
              <h2 id="place-details-title" className="mt-2 text-2xl font-extrabold text-[#e9e4d7] sm:text-3xl">
                {selectedPlace.name}
              </h2>
              <p className="mt-4 flex items-start gap-3 text-sm leading-7 text-[#9aa79a]">
                <MapPin size={18} className="mt-1 shrink-0 text-[#c3df91]" />
                <span>{selectedPlace.address || 'Address unavailable'}</span>
              </p>
              <div className="mt-5 grid gap-3 rounded-2xl border border-[#29342b] bg-[#0b100d] p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9aa79a]">Latitude</p>
                  <p className="mt-1 font-semibold text-[#e9e4d7]">{selectedPlace.lat ?? 'Unavailable'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9aa79a]">Longitude</p>
                  <p className="mt-1 font-semibold text-[#e9e4d7]">{selectedPlace.lon ?? 'Unavailable'}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={getMapUrl(selectedPlace)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#354334] px-5 py-3.5 text-sm font-bold text-[#e9e4d7] transition hover:bg-[#1d291d]"
                >
                  <Navigation size={16} /> Open in Google Maps
                </a>
                <button
                  onClick={() => addToItinerary(selectedPlace)}
                  disabled={isAdded(selectedPlace.id)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c3df91] px-5 py-3.5 text-sm font-bold text-[#10160f] transition hover:bg-[#a7c477] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAdded(selectedPlace.id) ? <Check size={16} /> : <Plus size={16} />}
                  {isAdded(selectedPlace.id) ? 'Already in My Trip' : 'Add to My Trip'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
