import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('trending')
  @ApiOperation({ summary: 'Get trending search terms derived from real data' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of trending terms (default 12, max 50)' })
  async getTrending(@Query('limit') limit?: string) {
    const data = await this.searchService.getTrending(limit ? parseInt(limit, 10) : 12);
    return { data };
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get autocomplete suggestions for a search term' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search term' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max suggestions (default 8, max 20)' })
  async getSuggestions(
    @Query('q') q: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.searchService.getSuggestions(q, limit ? parseInt(limit, 10) : 8);
    return { data };
  }
}
