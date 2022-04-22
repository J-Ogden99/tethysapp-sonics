from tethys_sdk.base import TethysAppBase, url_map_maker


class Sonics(TethysAppBase):
    """
    Tethys app class for SONICS.
    """

    name = 'SONICS'
    index = 'sonics:home'
    icon = 'sonics/images/icon.gif'
    package = 'sonics'
    root_url = 'sonics'
    color = '#2980b9'
    description = 'App for viewing SONICS historical simulation and forecast data for Peru'
    tags = ''
    enable_feedback = False
    feedback_emails = []

    def url_maps(self):
        """
        Add controllers
        """
        UrlMap = url_map_maker(self.root_url)

        url_maps = (
            UrlMap(
                name='home',
                url='sonics',
                controller='sonics.controllers.home'
            ),
        )

        return url_maps