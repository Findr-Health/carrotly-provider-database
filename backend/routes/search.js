const express = require('express');
const router = express.Router();
const axios = require('axios');

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

router.post('/business', async (req, res) => {
  try {
    const { businessName, zipCode } = req.body;

    if (!businessName) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    let query = businessName;
    if (zipCode) {
      query += ` ${zipCode}`;
    }

    const searchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const searchResponse = await axios.get(searchUrl, {
      params: {
        query,
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (searchResponse.data.status !== 'OK' && searchResponse.data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', searchResponse.data);
      return res.status(500).json({ error: 'Search failed' });
    }

    const results = searchResponse.data.results || [];

    const formattedResults = results.slice(0, 10).map(place => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photoReference: place.photos?.[0]?.photo_reference
    }));

    res.json({
      results: formattedResults,
      autoSelected: formattedResults.length === 1
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const response = await axios.get(detailsUrl, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,photos',
        key: GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(404).json({ error: 'Place not found' });
    }

    const place = response.data.result;

    let email = null;
    if (place.website) {
      try {
        const websiteResponse = await axios.get(place.website, { timeout: 5000 });
        const emailMatch = websiteResponse.data.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          email = emailMatch[0];
        }
      } catch (e) {
        // Couldn't fetch website
      }
    }

    res.json({
      placeId,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      email,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photoReference: place.photos?.[0]?.photo_reference
    });

  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ error: 'Failed to fetch place details' });
  }
});

module.exports = router;
