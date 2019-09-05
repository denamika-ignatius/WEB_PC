import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [

  { path : '',              loadChildren: './login/login.module#LoginModule'},
  { path : 'login',         loadChildren: './login/login.module#LoginModule'},
  { path : 'myAccount',     loadChildren: './my-account/my-account.module#MyAccountModule'},
  { path : 'marketInfo',    loadChildren: './market-info/market-info.module#MarketInfoModule'},
  { path : 'quotes',        loadChildren: './quotes/quotes.module#QuotesModule'},
  { path : 'ranking',       loadChildren: './ranking/ranking.module#RankingModule'},
  { path : 'stockSummary',  loadChildren: './stock-summary/stock-summary.module#StockSummaryModule'},
  { path : 'brokerSummary', loadChildren: './broker-summary/broker-summary.module#BrokerSummaryModule'},
  { path : 'news',          loadChildren: './news/news.module#NewsModule'},
  { path : 'analysis',      loadChildren: './analysis/analysis.module#AnalysisModule'},
  { path : 'option',        loadChildren: './option/option.module#OptionModule'},
  { path : '**',            redirectTo: '' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
