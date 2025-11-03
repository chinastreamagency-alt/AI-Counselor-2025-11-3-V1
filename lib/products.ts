export interface Product {
  id: string
  name: string
  description: string
  hours: number
  priceInCents: number
}

// Product catalog for hourly counseling services
export const PRODUCTS: Product[] = [
  {
    id: "1-hour",
    name: "1 Hour Service",
    description: "1 hour of AI counseling service",
    hours: 1,
    priceInCents: 999, // $9.99
  },
  {
    id: "5-hours",
    name: "5 Hours Service",
    description: "5 hours of AI counseling service",
    hours: 5,
    priceInCents: 4499, // $44.99
  },
  {
    id: "10-hours",
    name: "10 Hours Service",
    description: "10 hours of AI counseling service",
    hours: 10,
    priceInCents: 8499, // $84.99
  },
  {
    id: "100-hours",
    name: "100 Hours Service",
    description: "100 hours of AI counseling service",
    hours: 100,
    priceInCents: 69999, // $699.99
  },
]

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}
