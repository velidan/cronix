interface DraggablePriceLine {
  id: string
  price: number
  color: string
  title: string
  lineWidth: number
  lineStyle: number
  onDragStart?: (price: number) => void
  onDrag?: (price: number) => void
  onDragEnd?: (oldPrice: number, newPrice: number) => void
}

interface PluginOptions {
  lines: DraggablePriceLine[]
}

interface ChartApi {
  timeScale(): any
  priceScale(priceScaleId?: string): any
  priceToCoordinate(price: number): number | null
  coordinateToPrice(coordinate: number): number | null
  subscribeClick(handler: any): void
  unsubscribeClick(handler: any): void
  chartElement?(): HTMLElement
  // Alternative access methods
  container?: HTMLElement
  element?: HTMLElement
}

export class DraggablePriceLinesPlugin {
  private chart: ChartApi
  private series: any
  private lines: Map<string, DraggablePriceLine> = new Map()
  private priceLines: Map<string, any> = new Map()
  private isDragging = false
  private dragLineId: string | null = null
  private dragStartPrice = 0
  private clickHandler: any
  public onDragStateChange?: (isDragging: boolean) => void
  private boundMouseDown: (event: MouseEvent) => void
  private boundMouseMove: (event: MouseEvent) => void
  private boundMouseUp: (event: MouseEvent) => void
  private boundGlobalMouseUp: (event: MouseEvent) => void

  constructor(chart: ChartApi, series: any, options: PluginOptions = { lines: [] }) {
    this.chart = chart
    this.series = series
    
    // Bind event handlers to maintain proper 'this' context
    this.boundMouseDown = this.handleMouseDown.bind(this)
    this.boundMouseMove = this.handleMouseMove.bind(this)
    this.boundMouseUp = this.handleMouseUp.bind(this)
    this.boundGlobalMouseUp = this.handleGlobalMouseUp.bind(this)
    
    // Add initial lines
    options.lines.forEach(line => this.addLine(line))
    
    // Set up mouse event handlers
    this.setupEventHandlers()
  }

  private getChartElement(): HTMLElement | null {
    // Try different ways to get the chart element
    if (this.chart.chartElement && typeof this.chart.chartElement === 'function') {
      return this.chart.chartElement()
    } else if (this.chart.container) {
      return this.chart.container
    } else if (this.chart.element) {
      return this.chart.element
    } else {
      // Try to access via the chart object properties
      const chartObj = this.chart as any
      if (chartObj._private && chartObj._private._container) {
        return chartObj._private._container
      }
    }
    return null
  }

  private setupEventHandlers() {
    const chartElement = this.getChartElement()
    
    console.log('Chart object:', this.chart)
    console.log('Setting up event handlers on:', chartElement)
    
    if (!chartElement) {
      console.error('Could not find chart element to attach events to')
      return
    }
    
    // Mouse down handler
    chartElement.addEventListener('mousedown', this.boundMouseDown)
    
    // Mouse move handler  
    chartElement.addEventListener('mousemove', this.boundMouseMove)
    
    // Mouse up handler
    chartElement.addEventListener('mouseup', this.boundMouseUp)
    
    // Global mouse up handler to catch mouse releases outside the chart
    document.addEventListener('mouseup', this.boundGlobalMouseUp)
    
    // Prevent context menu on price lines
    chartElement.addEventListener('contextmenu', (e) => {
      if (this.isDragging) {
        e.preventDefault()
      }
    })
    
    console.log('Event handlers set up successfully on:', chartElement.tagName, chartElement.className)
  }

  private handleMouseDown(event: MouseEvent) {
    console.log('Mouse down event:', event.clientX, event.clientY)
    const chartElement = this.getChartElement()
    if (!chartElement) return
    
    const rect = chartElement.getBoundingClientRect()
    const y = event.clientY - rect.top
    console.log('Chart rect:', rect, 'Y offset:', y)
    
    // Convert Y coordinate to price using series API
    try {
      const price = this.series.coordinateToPrice(y)
      console.log('Clicked price:', price)
      if (price === null) return
      
      // Find the closest line within threshold
      const threshold = 10 // pixels - increased for easier clicking
      let closestLine: string | null = null
      let smallestDiff = Infinity
      
      console.log('Checking', this.lines.size, 'lines for proximity')
      this.lines.forEach((line, id) => {
        const lineY = this.series.priceToCoordinate(line.price)
        console.log('Line', id, 'at price', line.price, 'Y coordinate:', lineY)
        if (lineY !== null) {
          const diff = Math.abs(y - lineY)
          console.log('Distance from click:', diff, 'threshold:', threshold)
          if (diff < threshold && diff < smallestDiff) {
            smallestDiff = diff
            closestLine = id
          }
        }
      })
      
      if (closestLine) {
        console.log('Starting drag for line:', closestLine)
        this.isDragging = true
        this.dragLineId = closestLine
        const line = this.lines.get(closestLine)!
        this.dragStartPrice = line.price
        
        // Change cursor
        chartElement.style.cursor = 'grabbing'
        
        // Notify drag state change
        if (this.onDragStateChange) {
          this.onDragStateChange(true)
        }
        
        // Prevent chart interaction
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        
        // Call onDragStart callback
        if (line.onDragStart) {
          line.onDragStart(line.price)
        }
      } else {
        console.log('No line found within threshold')
      }
    } catch (error) {
      console.error('Error in handleMouseDown:', error)
    }
  }

  private handleMouseMove(event: MouseEvent) {
    const chartElement = this.getChartElement()
    if (!chartElement) return
    
    const rect = chartElement.getBoundingClientRect()
    const y = event.clientY - rect.top
    
    if (this.isDragging && this.dragLineId) {
      // Convert Y coordinate to price using series API
      const newPrice = this.series.coordinateToPrice(y)
      if (newPrice === null) return
      
      // Update line price
      const line = this.lines.get(this.dragLineId)!
      line.price = newPrice
      
      // Update visual line
      this.updatePriceLine(this.dragLineId, line)
      
      // Call onDrag callback
      if (line.onDrag) {
        line.onDrag(newPrice)
      }
      
      
      // Prevent chart interaction during drag
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    } else {
      // Check if mouse is over a draggable line
      const price = this.series.coordinateToPrice(y)
      if (price !== null) {
        const threshold = 10
        let overLine = false
        
        this.lines.forEach((line) => {
          const lineY = this.series.priceToCoordinate(line.price)
          if (lineY !== null && Math.abs(y - lineY) < threshold) {
            overLine = true
          }
        })
        
        // Change cursor when hovering over line
        chartElement.style.cursor = overLine ? 'grab' : 'default'
      }
    }
  }

  private handleMouseUp(event: MouseEvent) {
    this.endDrag(event)
  }

  private handleGlobalMouseUp(event: MouseEvent) {
    this.endDrag(event)
  }

  private endDrag(event: MouseEvent) {
    if (this.isDragging && this.dragLineId) {
      const line = this.lines.get(this.dragLineId)!
      
      // Call onDragEnd callback
      if (line.onDragEnd) {
        line.onDragEnd(this.dragStartPrice, line.price)
      }
      
      this.isDragging = false
      this.dragLineId = null
      this.dragStartPrice = 0
      
      // Notify drag state change
      if (this.onDragStateChange) {
        this.onDragStateChange(false)
      }
      
      // Reset cursor
      const chartElement = this.getChartElement()
      if (chartElement) {
        chartElement.style.cursor = 'default'
      }
      
      // Prevent chart interaction
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
  }

  addLine(line: DraggablePriceLine): void {
    console.log('Adding draggable line:', line.id, 'at price:', line.price)
    this.lines.set(line.id, line)
    this.createPriceLine(line.id, line)
    console.log('Total lines:', this.lines.size)
  }

  removeLine(id: string): void {
    const priceLine = this.priceLines.get(id)
    if (priceLine) {
      this.series.removePriceLine(priceLine)
      this.priceLines.delete(id)
    }
    this.lines.delete(id)
  }

  updateLine(id: string, updates: Partial<DraggablePriceLine>): void {
    const line = this.lines.get(id)
    if (line) {
      Object.assign(line, updates)
      this.updatePriceLine(id, line)
    }
  }

  private createPriceLine(id: string, line: DraggablePriceLine): void {
    const priceLine = this.series.createPriceLine({
      price: line.price,
      color: line.color,
      lineWidth: line.lineWidth,
      lineStyle: line.lineStyle,
      axisLabelVisible: true,
      title: line.title
    })
    
    this.priceLines.set(id, priceLine)
  }

  private updatePriceLine(id: string, line: DraggablePriceLine): void {
    const priceLine = this.priceLines.get(id)
    if (priceLine) {
      // Remove old line
      this.series.removePriceLine(priceLine)
      
      // Create new line with updated price
      this.createPriceLine(id, line)
    }
  }


  destroy(): void {
    // Remove all price lines
    this.priceLines.forEach(priceLine => {
      this.series.removePriceLine(priceLine)
    })
    
    // Remove event listeners
    const chartElement = this.getChartElement()
    if (chartElement) {
      chartElement.removeEventListener('mousedown', this.boundMouseDown)
      chartElement.removeEventListener('mousemove', this.boundMouseMove)
      chartElement.removeEventListener('mouseup', this.boundMouseUp)
    }
    
    // Remove global event listener
    document.removeEventListener('mouseup', this.boundGlobalMouseUp)
    
    // Clear maps
    this.lines.clear()
    this.priceLines.clear()
  }

  getLines(): DraggablePriceLine[] {
    return Array.from(this.lines.values())
  }

  getLine(id: string): DraggablePriceLine | undefined {
    return this.lines.get(id)
  }
}

export default DraggablePriceLinesPlugin