import type { ComponentType } from 'react';
import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';
import type { EntriesData } from '@/hooks/useEntries';
import { FlightForm } from './FlightForm';
import { LodgingForm } from './LodgingForm';
import { CarRentalForm } from './CarRentalForm';
import { RestaurantForm } from './RestaurantForm';
import { ActivityForm } from './ActivityForm';
import { FlightIdeaForm } from './idea/FlightIdeaForm';
import { LodgingIdeaForm } from './idea/LodgingIdeaForm';
import { CarRentalIdeaForm } from './idea/CarRentalIdeaForm';
import { RestaurantIdeaForm } from './idea/RestaurantIdeaForm';
import { ActivityIdeaForm } from './idea/ActivityIdeaForm';
import { createElement } from 'react';

type AnyEntry = Flight | Lodging | CarRental | Restaurant | Activity;

type PlanFormProps = {
  tripId: string;
  onClose: () => void;
  existingEntry?: AnyEntry;
  moveToPlan?: boolean;
};

type IdeaFormProps = {
  tripId: string;
  onClose: () => void;
  existingIdea?: AnyEntry;
};

export const planFormRegistry: Record<EntryType, ComponentType<PlanFormProps>> = {
  flight: (props) => createElement(FlightForm, { tripId: props.tripId, onClose: props.onClose, existingFlight: props.existingEntry as Flight | undefined, moveToPlan: props.moveToPlan }),
  lodging: (props) => createElement(LodgingForm, { tripId: props.tripId, onClose: props.onClose, existingLodging: props.existingEntry as Lodging | undefined, moveToPlan: props.moveToPlan }),
  carRental: (props) => createElement(CarRentalForm, { tripId: props.tripId, onClose: props.onClose, existingCarRental: props.existingEntry as CarRental | undefined, moveToPlan: props.moveToPlan }),
  restaurant: (props) => createElement(RestaurantForm, { tripId: props.tripId, onClose: props.onClose, existingRestaurant: props.existingEntry as Restaurant | undefined, moveToPlan: props.moveToPlan }),
  activity: (props) => createElement(ActivityForm, { tripId: props.tripId, onClose: props.onClose, existingActivity: props.existingEntry as Activity | undefined, moveToPlan: props.moveToPlan }),
};

export const ideaFormRegistry: Record<EntryType, ComponentType<IdeaFormProps>> = {
  flight: (props) => createElement(FlightIdeaForm, { tripId: props.tripId, onClose: props.onClose, existingIdea: props.existingIdea as Flight | undefined }),
  lodging: (props) => createElement(LodgingIdeaForm, { tripId: props.tripId, onClose: props.onClose, existingIdea: props.existingIdea as Lodging | undefined }),
  carRental: (props) => createElement(CarRentalIdeaForm, { tripId: props.tripId, onClose: props.onClose, existingIdea: props.existingIdea as CarRental | undefined }),
  restaurant: (props) => createElement(RestaurantIdeaForm, { tripId: props.tripId, onClose: props.onClose, existingIdea: props.existingIdea as Restaurant | undefined }),
  activity: (props) => createElement(ActivityIdeaForm, { tripId: props.tripId, onClose: props.onClose, existingIdea: props.existingIdea as Activity | undefined }),
};

export const ENTRIES_KEY: Record<EntryType, keyof EntriesData> = {
  flight: 'flights',
  lodging: 'lodgings',
  carRental: 'carRentals',
  restaurant: 'restaurants',
  activity: 'activities',
};
